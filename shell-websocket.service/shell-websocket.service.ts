
import { Observable, Subject, Subscription } from 'rxjs';
import * as ed from 'noble-ed25519';
import { timeout } from 'rxjs/operators';
// import { ConnectionNodeParameters, ShellEvent, ShellEventType, ShellHubIncomingMessages, ShellHubOutgoingMessages, TerminalSize } from './ssm-shell-websocket.service.types';
import {DaemonHubOutgoingMessages, DaemonHubIncomingMessages, TerminalSize, ShellActions, ConnectionNodeParameters} from './shell-websocket.service.types';

import { AuthConfigService } from '../auth-config-service/auth-config.service';
import { ILogger } from '../logging/logging.types';
import { KeySplittingService } from '../keysplitting.service/keysplitting.service';
// import { DataAckMessageWrapper, DataAckPayload, DataMessageWrapper, ErrorMessageWrapper, ShellActions, ShellTerminalSizeActionPayload, SsmTargetInfo, SynAckMessageWrapper, SynAckPayload, SynMessageWrapper, KeysplittingErrorTypes } from '../keysplitting.service/keysplitting-types';
// import {ShellActions}  from '../keysplitting.service/keysplitting-types';
import Utils from '../utility/utils';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { SignalRLogger } from '../logging/signalr-logger';
import { DataMessageWrapper, SynMessageWrapper } from '../keysplitting.service/keysplitting-types';
import { v4 as uuidv4 } from 'uuid';

interface AgentMessage {
    channelId: string
    messageType: string
    schemaVersion: string
    messagePayload: string
}

interface OpenDataChannelPayload {
    action: string,
    syn: string
}

const KeysplittingHandshakeTimeout = 15; // in seconds
export class ShellWebsocketService
{
    private websocket : HubConnection;

    // Input subscriptions
    private inputSubscription: Subscription;
    private resizeSubscription: Subscription;

    // Output Observables
    private outputSubject: Subject<string>;
    public outputData: Observable<string>;

    // private replaySubject: Subject<string>;
    // public replayData: Observable<string>;

    // private shellEventSubject: Subject<ShellEvent>;
    // public shellEventData: Observable<ShellEvent>;

    private keysplittingHandshakeCompleteSubject = new Subject<boolean>();
    private keysplittingHandshakeComplete: Observable<boolean> = this.keysplittingHandshakeCompleteSubject.asObservable();

    // private synShellOpenMessageHPointer: string;
    // private synAckShellOpenMessageHPointer: string;
    // private dataShellOpenMessageHPointer: string;
    // private dataAckShellOpenMessageHPointer: string;

    // private sequenceNumber = 0;
    // private currentInputMessage: ShellMessage;
    // private lastAckHPointer: string;

    // private inputMessageBuffer: ShellMessage[] = [];
    // private outgoingShellInputMessages: { [h: string]: ShellMessage } = {};

    // private isActiveClient = false;

    private currentIdToken: string = undefined;
    // private targetPublicKey: ed.Point;
    private dataChannelId: string = uuidv4();

    constructor(
        private keySplittingService: KeySplittingService,
        // private targetInfo: SsmTargetInfo,
        private logger: ILogger,
        private authConfigService: AuthConfigService,
        private connectionId: string,
        private connectionNodeParameters: ConnectionNodeParameters,
        inputStream: Subject<string>,
        resizeStream: Subject<TerminalSize>
    ) {
        this.outputSubject = new Subject<string>();
        this.outputData = this.outputSubject.asObservable();
        // this.shellEventSubject = new Subject<ShellEvent>();
        // this.shellEventData = this.shellEventSubject.asObservable();

        this.connectionId = connectionId;
        this.inputSubscription = inputStream.asObservable().subscribe((data) => this.handleInput(data));
        // this.resizeSubscription = resizeStream.asObservable().subscribe((data) => this.handleResize(data));
    }

    public async start()
    {
        this.logger.info("creating connection");
        this.websocket = await this.createConnection();
        this.logger.info("connection created!!!!!!!");

        this.websocket.on(
            DaemonHubIncomingMessages.shellMessage,
            req =>
            {
                // ref: https://git.coolaj86.com/coolaj86/atob.js/src/branch/master/node-atob.js
                this.outputSubject.next(req.data);
            }
        );

        // // this is called if the server closes the websocket
        // this.websocket.onclose(() => {
        //     this.logger.debug('websocket closed by server');
        //     this.shellEventSubject.next({ type: ShellEventType.Disconnect });
        // });

        // this.websocket.onreconnecting(_ => {
        //     this.shellEventSubject.next({ type: ShellEventType.BrokenWebsocket });
        // });

        // this.websocket.onreconnected(_ => {
        //     this.logger.debug('Websocket reconnected');
        // });

        // Make sure keysplitting service is initialized (keys loaded)
        await this.keySplittingService.init();

        this.websocket.on(DaemonHubIncomingMessages.shellMessage, (shellMessage) => this.handleAgentMessage(shellMessage));

        // Finally start the websocket connection
        await this.websocket.start();

        this.logger.info("WEBSOCKET STARTED");

        this.logger.info("INITIALIZING DATACHANNEL");
        await this.initDataChannel();
        this.logger.info("DATACHANNEL INITIALIZED");

        //await this.performMrZAPHandshake();
    }

    private async performMrZAPHandshake(): Promise<boolean> {
        // if(this.targetInfo.agentVersion === '') {
        //     throw new Error(`Unable to perform keysplitting handshake: agentVersion is not known for target ${this.targetInfo.id}`);
        // }
        // if(this.targetInfo.agentId === '' ) {
        //     throw new Error(`Unknown agentId in sendOpenShellSynMessage for target ${this.targetInfo.id}`);
        // }

        // this.logger.debug(`Starting keysplitting handshake with ${this.targetInfo.id}`);
        // this.logger.debug(`Agent Version ${this.targetInfo.agentVersion}, Agent ID: ${this.targetInfo.agentId}`);

        return new Promise(async (res, rej) => {
            this.keysplittingHandshakeComplete
                .pipe(timeout(KeysplittingHandshakeTimeout * 1000))
                .subscribe(
                    completedSuccessfully => res(completedSuccessfully),
                    _ => rej(`Keyspliting handshake timed out after ${KeysplittingHandshakeTimeout} seconds`)
                );

            // start the keysplitting handshake
            await this.initDataChannel();
        });
    }

    private async initDataChannel() {
        this.currentIdToken = await this.authConfigService.getIdToken();
        const synMessage = await this.keySplittingService.buildSynMessage(
            "",
            "shell",
            this.currentIdToken
        );

        const openDCMessage: OpenDataChannelPayload = {
            action: "shell",
            syn: Buffer.from(JSON.stringify(synMessage)).toString('base64')
        }

        //const mBytes = new TextEncoder().encode(JSON.stringify(openDCMessage))
        const agentMessage : AgentMessage = {
            channelId: this.dataChannelId,
            messageType: "openDataChannel",
            schemaVersion: "",
            messagePayload: Buffer.from(JSON.stringify(openDCMessage)).toString('base64')
        }

        // this.synShellOpenMessageHPointer = this.keySplittingService.getHPointer(synMessage.synPayload.payload);
        // await this.sendMessage<OpenDataChannelMessage>(openDCMessage);
        await this.sendWebsocketMessage(DaemonHubOutgoingMessages.openDataChannel, agentMessage);
    }

    private async handleAgentMessage(message: AgentMessage) {
        this.logger.info(`WE GOT SOMETHING ${JSON.stringify(message)}`)

        // try {
        //     this.logger.debug(`Received SynAck message: ${JSON.stringify(synAckMessage)}`);

        //     // For now we only only a single client to be attached to the shell
        //     // at a time so if we see another synack message we dont recognize
        //     // immediately disconnect
        //     if (synAckMessage.synAckPayload.payload.hPointer != this.synShellOpenMessageHPointer) {
        //         this.logger.debug('[SynAck] received message from another client.');
        //         this.isActiveClient = false;
        //         this.shellEventSubject.next({ type: ShellEventType.Unattached});
        //         return;
        //     }

        //     // For out SynAck message we need to set the public key of the target
        //     const pubkey = synAckMessage.synAckPayload.payload.targetPublicKey;
        //     this.targetPublicKey = ed.Point.fromHex(Buffer.from(pubkey, 'base64').toString('hex'));

        //     // Validate our signature
        //     if (await this.keySplittingService.validateSignature<SynAckPayload>(synAckMessage.synAckPayload, this.targetPublicKey) != true) {
        //         const errorString = '[SynAck] Error Validating Signature!';
        //         this.logger.error(errorString);
        //         throw new Error(errorString);
        //     }

        //     this.synAckShellOpenMessageHPointer = this.keySplittingService.getHPointer(synAckMessage.synAckPayload.payload);
        //     this.lastAckHPointer = this.synAckShellOpenMessageHPointer;
        //     this.isActiveClient = true;

        //     await this.sendShellOpenDataMessage();
        // } catch(e) {
        //     this.logger.error(`Error in handleSynAck: ${e}`);
        // }
    }
    
    private async sendMessage<TReq>(message: TReq) {
        // wrap our message in an Agent Message
        const agentMessage : AgentMessage = {
            channelId: this.dataChannelId,
            messageType: "keysplitting",
            schemaVersion: "",
            messagePayload: Buffer.from(JSON.stringify(message)).toString('base64')
        }
        // this.logger.debug(`Sending message: ${JSON.stringify(message)}`);

        await this.sendWebsocketMessage(DaemonHubOutgoingMessages.shellMessage, agentMessage);
    }

    private async handleInput(data: string): Promise<void> {
        this.logger.debug(`got new input ${data}`);

        // Check whether current BZCert's idtoken has been refreshed
        // If yes we need to perform a new handshake before sending data
        const IdToken = await this.authConfigService.getIdToken();
        if (this.currentIdToken !== IdToken){
            this.logger.debug(`Current id token has expired, requesting new and performing new mrzap handshake`);
            await this.performMrZAPHandshake();
        }
        
        const dataMessage = await this.keySplittingService.buildDataMessage(
            "",
            "shell/input",
            this.currentIdToken,
            data,
            "this.lastAckHPointer"
        );

        this.sendMessage<DataMessageWrapper>(dataMessage);

        // Skip new input messages if we are not the active client
        // if(! this.isActiveClient) {
        //     this.logger.debug(`[handleInput] received when not active client...skipping.`);
        //     return;
        // }

        // const inputPayload = data;

        // // Add to input message buffer
        // const shellInput: ShellMessage = {
        //     inputType: ShellActions.Input,
        //     inputPayload: inputPayload,
        //     seqNum: this.sequenceNumber++,
        // };
        // this.inputMessageBuffer.push(shellInput);

        // await this.processInputMessageQueue();
    }

    public async dispose() : Promise<void>
    {
        await this.destroyConnection();
        // this.inputSubscription.unsubscribe();
        // this.resizeSubscription.unsubscribe();
        // this.shellEventSubject.complete();
    }

    private async sendWebsocketMessage(methodName: string, message: AgentMessage): Promise<void> {
        if(this.websocket === undefined || this.websocket.state == HubConnectionState.Disconnected)
            throw new Error('Hub disconnected');

        this.logger.info("TRYING TO SEND SOMETHING");

        await this.websocket.invoke(methodName, message);
    }

    private async createConnection(): Promise<HubConnection> {
        // connectionId is related to terminal session
        // connectionNodeAuthToken is used to authenticate the connection
        const queryString = `?connectionId=${this.connectionId}&authToken=${this.connectionNodeParameters.authToken}&connectionType=shell`;

        const connectionUrl = `${this.connectionNodeParameters.connectionServiceUrl}hub/daemon/${queryString}`;

        this.logger.info("connecting with endpoint: " + connectionUrl)

        return new HubConnectionBuilder()
            .withUrl(
                connectionUrl,
                { accessTokenFactory: async () => await this.authConfigService.getIdToken()}
            )
            .withAutomaticReconnect([100, 1000, 10000, 30000, 60000]) // retry times in ms
            .configureLogging(new SignalRLogger(this.logger, LogLevel.Debug))
            .build();
    }

    private async destroyConnection() {
        // TODO: close datachannel

        if(this.websocket) {
            await this.websocket.stop();
            this.websocket = undefined;
        }
    }
}