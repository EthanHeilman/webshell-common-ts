import SshPK from 'sshpk';
import * as ed from 'noble-ed25519';
import { Observable, Subject } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

import { MrtapService } from '../mrtap.service/mrtap.service';
import { AddSshPubKeyMessage, HUB_RECEIVE_MAX_SIZE, SsmTunnelHubIncomingMessages, SsmTunnelHubOutgoingMessages, StartTunnelMessage, TunnelDataMessage, WebsocketResponse } from './ssm-tunnel-websocket.types';
import { SynMessageWrapper, DataMessageWrapper, SynAckMessageWrapper, DataAckMessageWrapper, ErrorMessageWrapper, KeysplittingErrorTypes, SshOpenActionPayload, DataAckPayload, SynAckPayload, SsmTargetInfo, SshTunnelActions } from '../mrtap.service/mrtap-types';
import { SignalRLogger } from '../../webshell-common-ts/logging/signalr-logger';
import { ILogger } from '../logging/logging.types';
import { AuthConfigService } from '../auth-config-service/auth-config.service';

const MrtapHandshakeTimeout = 15; // in seconds

export class SsmTunnelWebsocketService {
    private sequenceNumber = 0;
    private targetInfo: SsmTargetInfo;
    private websocket: HubConnection;
    private errorSubject: Subject<string> = new Subject<string>();
    private username: string;
    private sshPublicKey: SshPK.Key;
    private targetPublicKey: ed.Point;

    private mrtapHandshakeCompleteSubject = new Subject<boolean>();
    private mrtapHandshakeComplete: Observable<boolean> = this.mrtapHandshakeCompleteSubject.asObservable();

    private synSshOpenMessageHPointer: string;
    private dataSshOpenMessageHPointer: string;
    private synAckSshOpenMessageHPointer: string;
    private dataAckSshOpenMessageHPointer: string;

    public errors: Observable<string> = this.errorSubject.asObservable();

    constructor(
        private logger: ILogger,
        private mrtapService: MrtapService,
        private authConfigService: AuthConfigService,
        targetInfo: SsmTargetInfo
    ) {
        this.targetInfo = targetInfo;
    }

    public async setupWebsocketTunnel(
        username: string,
        port: number,
        sshPublicKey: SshPK.Key,
        mrtapEnabled: boolean = true
    ): Promise<boolean> {
        try {
            this.username = username;
            this.sshPublicKey = sshPublicKey;

            await this.setupWebsocket();

            await this.sendStartTunnelMessage({
                targetId: this.targetInfo.id,
                targetPort: port,
                targetUser: username
            });

            if ((this.targetInfo.agentVersion != '' && this.targetInfo.agentVersion != 'Unknown') && mrtapEnabled) {
                // If MrTAP is enabled start the MrTAP handshake
                // and rely on this for setting up the ephemeral ssh key on the
                // target
                return await this.performMrtapHandshake();
            } else {
                if (mrtapEnabled && (this.targetInfo.agentVersion == '' || this.targetInfo.agentVersion == 'Unknown')) {
                    this.logger.warn('MrTAP enabled, but target did not return an agent version! Defaulting to normal ssh tunneling.');
                }
                // If MrTAP not enabled then send the
                await this.sendPubKeyViaBastion(sshPublicKey);
            }

            return true;
        } catch (err) {
            this.handleError(`Failed to setup tunnel: ${err}`);
            return false;
        }
    }

    public async sendData(data: Buffer) {
        const base64EncData = data.toString('base64');
        const len = base64EncData.length;

        try {
            // Batch the send data so that an individual message stays below the
            // HUB_RECEIVE_MAX_SIZE limit
            let offset = 0;

            // Give some slack for the rest of the TunnelDataMessage (sequence
            // number + json encoding)
            const maxChunkSize = HUB_RECEIVE_MAX_SIZE - 1024;

            while (offset < len) {

                const chunkSize = Math.min(len - offset, maxChunkSize);
                const dataMessage: TunnelDataMessage = {
                    data: base64EncData.substr(offset, chunkSize),
                    sequenceNumber: this.sequenceNumber++
                };
                offset += chunkSize;

                await this.sendWebsocketMessage<TunnelDataMessage>(
                    SsmTunnelHubOutgoingMessages.SendData,
                    dataMessage
                );
            }
        } catch (err) {
            this.handleError(err);
        }
    }

    public async closeConnection(): Promise<void> {
        if (this.websocket) {
            await this.websocket.stop();
            this.websocket = undefined;
        }
    }

    // This will send the pubkey through the bastion's AddSshPubKey websocket
    // method which uses RunCommand to add the ssh pubkey to the target's
    // authorized_keys file. This code path should ultimately be removed once
    // MrTAP is fully enforced
    private async sendPubKeyViaBastion(pubKey: SshPK.Key) {
        // key type and pubkey are space delimited in the resulting string
        // https://github.com/joyent/node-sshpk/blob/4342c21c2e0d3860f5268fd6fd8af6bdeddcc6fc/lib/formats/ssh.js#L99
        const [keyType, sshPubKey] = pubKey.toString('ssh').split(' ');

        await this.sendAddSshPubKeyMessage({
            keyType: keyType,
            publicKey: sshPubKey
        });
    }

    private async performMrtapHandshake(): Promise<boolean> {
        if (this.targetInfo.agentVersion === '') {
            throw new Error(`Unable to perform MrTAP handshake: agentVersion is not known for target ${this.targetInfo.id}`);
        }

        this.logger.debug(`Starting MrTAP handshake with ${this.targetInfo.id}`);
        this.logger.debug(`Agent Version ${this.targetInfo.agentVersion}, Agent ID: ${this.targetInfo.agentId}`);

        await this.sendOpenShellSynMessage();

        return new Promise((res, rej) => {
            this.mrtapHandshakeComplete
                .pipe(timeout(MrtapHandshakeTimeout * 1000))
                .subscribe(
                    completedSuccessfully => res(completedSuccessfully),
                    _ => rej(`Keyspliting handshake timed out after ${MrtapHandshakeTimeout} seconds`)
                );
        });
    }

    private async sendOpenShellSynMessage() {
        if (this.targetInfo.agentId === '') {
            throw new Error(`Unknown agentId in sendOpenShellSynMessage for target ${this.targetInfo.id}`);
        }

        const synMessage = await this.mrtapService.buildSynMessage(
            this.targetInfo.agentId,
            SshTunnelActions.Open,
            await this.authConfigService.getIdToken()
        );
        this.synSshOpenMessageHPointer = this.mrtapService.getHPointer(synMessage.synPayload.payload);

        await this.sendSynMessage(synMessage);
    }

    private async sendOpenShellDataMessage() {
        if (this.targetInfo.agentId === '') {
            throw new Error(`Unknown agentId in sendOpenShellDataMessage for target ${this.targetInfo.id}`);
        }

        // key type and pubkey are space delimited in the resulting string
        // agent currently assuming key type of ssh-rsa
        // https://github.com/joyent/node-sshpk/blob/4342c21c2e0d3860f5268fd6fd8af6bdeddcc6fc/lib/formats/ssh.js#L99
        const sshPubKey = this.sshPublicKey.toString('ssh').split(' ')[1];

        const sshTunnelOpenData: SshOpenActionPayload = {
            username: this.username,
            sshPubKey: sshPubKey
        };

        const dataMessage = await this.mrtapService.buildDataMessage(
            this.targetInfo.agentId,
            SshTunnelActions.Open,
            await this.authConfigService.getIdToken(),
            sshTunnelOpenData,
            this.synAckSshOpenMessageHPointer
        );

        this.dataSshOpenMessageHPointer = this.mrtapService.getHPointer(dataMessage.dataPayload.payload);

        await this.sendDataMessage(dataMessage);
    }

    private async setupWebsocket() {
        await this.startWebsocket();

        this.websocket.onclose((error) => {
            if (error)
                this.handleError(`Websocket was closed by server: ${error}`);
        });

        // Set up ReceiveData handler
        this.websocket.on(SsmTunnelHubIncomingMessages.ReceiveData, (dataMessage: TunnelDataMessage) => {
            try {
                const buf = Buffer.from(dataMessage.data, 'base64');

                this.logger.debug(`received tunnel data message with sequence number ${dataMessage.sequenceNumber}`);

                // Write to standard out for ProxyCommand to consume
                process.stdout.write(buf);
            } catch (e) {
                this.logger.error(`Error in ReceiveData: ${e}`);
            }
        });

        // Set up receive message handlers
        this.websocket.on(SsmTunnelHubIncomingMessages.ReceiveSynAck, async (synAckMessage: SynAckMessageWrapper) => {
            try {
                this.logger.debug(`Received SynAck message: ${JSON.stringify(synAckMessage)}`);

                // Validate our HPointer
                if (synAckMessage.synAckPayload.payload.hPointer !== this.synSshOpenMessageHPointer) {
                    const errorString = '[SynAck] Error Validating HPointer!';
                    this.logger.error(errorString);
                    throw new Error(errorString);
                }

                // For out SynAck message we need to set the public key of the target
                const pubkey = synAckMessage.synAckPayload.payload.targetPublicKey;
                this.targetPublicKey = ed.Point.fromHex(Buffer.from(pubkey, 'base64').toString('hex'));

                // Validate our signature
                if (await this.mrtapService.validateSignature<SynAckPayload>(synAckMessage.synAckPayload, this.targetPublicKey) != true) {
                    const errorString = '[SynAck] Error Validating Signature!';
                    this.logger.error(errorString);
                    throw new Error(errorString);
                }

                // Set synAck hPointer
                this.synAckSshOpenMessageHPointer = this.mrtapService.getHPointer(synAckMessage.synAckPayload.payload);

                this.sendOpenShellDataMessage();
            } catch (e) {
                this.handleError(`Error in ReceiveDataAck: ${e}`);
            }
        });
        this.websocket.on(SsmTunnelHubIncomingMessages.ReceiveDataAck, async (dataAckMessage: DataAckMessageWrapper) => {
            try {
                this.logger.debug(`Received DataAck message: ${JSON.stringify(dataAckMessage)}`);

                // Validate our HPointer
                if (dataAckMessage.dataAckPayload.payload.hPointer !== this.dataSshOpenMessageHPointer) {
                    const errorString = '[DataAck] Error Validating HPointer!';
                    this.logger.error(errorString);
                    throw new Error(errorString);
                }

                // Validate our signature
                if (await this.mrtapService.validateSignature<DataAckPayload>(dataAckMessage.dataAckPayload, this.targetPublicKey) != true) {
                    const errorString = '[DataAck] Error Validating Signature!';
                    this.logger.error(errorString);
                    throw new Error(errorString);
                }

                this.dataAckSshOpenMessageHPointer = this.mrtapService.getHPointer(dataAckMessage.dataAckPayload.payload);

                // Mark the MrTAP handshake as completed successfully
                this.mrtapHandshakeCompleteSubject.next(true);

            } catch (e) {
                this.handleError(`Error in ReceiveDataAck: ${e}`);
            }
        });

        this.websocket.on(SsmTunnelHubIncomingMessages.ReceiveError, (errorMessage: ErrorMessageWrapper) => {
            const errorPayload = errorMessage.errorPayload.payload;

            // TODO: check signature on error payload

            this.logger.error(`Got agent MrTAP error on message ${errorPayload.hPointer}`);
            this.logger.error(`Type: ${errorPayload.errorType}`);
            this.logger.error(`Error Message: ${errorPayload.message}`);

            switch (errorPayload.errorType) {
            case KeysplittingErrorTypes.BZECertInvalidIDToken:
                this.handleError('MrTAP Error: Invalid ID token. Please try logging out and in again.');
                break;
            default:
                this.handleError(`Unhandled MrTAP Error: ${errorPayload.errorType}::${errorPayload.message}`);
            }
        });
    }

    private async createConnection(): Promise<HubConnection> {
        const connectionUrl = `${this.authConfigService.getServiceUrl()}hub/ssm-tunnel/`;
        const sessionIdCookie = `${this.authConfigService.getSessionIdCookieName()}=${this.authConfigService.getSessionId()}`;
        const sessionTokenCookie = `${this.authConfigService.getSessionTokenCookieName()}=${this.authConfigService.getSessionToken()}`;

        const connectionBuilder = new HubConnectionBuilder();
        connectionBuilder
            .withUrl(
                connectionUrl,
                {
                    accessTokenFactory: async () => await this.authConfigService.getIdToken(),
                    headers: { 'cookie': `${sessionIdCookie}; ${sessionTokenCookie}` }
                }
            )
            .configureLogging(new SignalRLogger(this.logger, LogLevel.Warning));
        return connectionBuilder.build();
    }

    private async startWebsocket() {
        this.websocket = await this.createConnection();
        await this.websocket.start();
    }

    private async sendStartTunnelMessage(startTunnelMessage: StartTunnelMessage) {
        await this.sendWebsocketMessage<StartTunnelMessage>(
            SsmTunnelHubOutgoingMessages.StartTunnel,
            startTunnelMessage
        );
    }

    private async sendAddSshPubKeyMessage(addSshPubKeyMessage: AddSshPubKeyMessage) {
        await this.sendWebsocketMessage<AddSshPubKeyMessage>(
            SsmTunnelHubOutgoingMessages.AddSshPubKey,
            addSshPubKeyMessage
        );
    }

    private async sendWebsocketMessage<T>(methodName: string, message: T) {
        if (this.websocket === undefined || this.websocket.state == HubConnectionState.Disconnected)
            throw new Error('Hub disconnected');

        const response = await this.websocket.invoke<WebsocketResponse>(methodName, message);

        // Handle Hub Error
        if (response.error) {
            throw new Error(response.errorMessage);
        }
    }

    private handleError(errorMessage: string) {
        this.logger.error(errorMessage);
        this.errorSubject.next(errorMessage);
    }

    private async sendSynMessage(synMessage: SynMessageWrapper): Promise<void> {
        this.logger.debug('Sending syn message...');
        await this.sendWebsocketMessage<SynMessageWrapper>(
            SsmTunnelHubOutgoingMessages.SynMessage,
            synMessage
        );
    }

    private async sendDataMessage(dataMessage: DataMessageWrapper): Promise<void> {
        this.logger.debug('Sending data message...');
        await this.sendWebsocketMessage<DataMessageWrapper>(
            SsmTunnelHubOutgoingMessages.DataMessage,
            dataMessage
        );
    }
}