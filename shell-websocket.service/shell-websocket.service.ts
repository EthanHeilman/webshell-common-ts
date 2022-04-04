
import { Observable, Subject, Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {DaemonHubOutgoingMessages, ShellEvent, ShellEventType, DaemonHubIncomingMessages, TerminalSize, ConnectionNodeParameters, WebsocketResponse} from './shell-websocket.service.types';

import { AuthConfigService } from '../auth-config-service/auth-config.service';
import { ILogger } from '../logging/logging.types';
import { KeySplittingService } from '../keysplitting.service/keysplitting.service';
import Utils from '../utility/utils';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { SignalRLogger } from '../logging/signalr-logger';
import { BZECert } from '../keysplitting.service/keysplitting-types';
import { v4 as uuidv4 } from 'uuid';
import * as ed from 'noble-ed25519';
import { BzeroAgentSummary } from '../http/v2/target/bzero/types/bzero-agent-summary.types';


interface AgentMessage {
    channelId: string
    messageType: string
    schemaVersion: string
    messagePayload: string
}

const steamMessageType = {
    ShellStdOut: 'shell/stdout',
    ShellQuit: 'shell/quit'
};

const agentMessageType = {
    error: 'error',
    keysplitting: 'keysplitting',
    stream: 'stream'
};

const keysplittingType = {
    Syn: 'Syn',
    SynAck: 'SynAck',
    Data: 'Data',
    DataAck: 'DataAck'
};

const shellAction = {
    Open: 'shell/open',
    Input: 'shell/input',
    Replay: 'shell/replay',
    Resize: 'shell/resize',
    Close: 'shell/close'
};

interface OpenDataChannelPayload {
    action: string,
    syn: string
}

interface KeysplittingMessage<TPayload> {
    type: string,
    keysplittingPayload: TPayload,
    signature: string
}

interface BaseKeysplittingPayload {
    timestamp: string,
    schemaVersion: string,
    type: string,
    action: string,
}

interface Syn extends BaseKeysplittingPayload {
    targetId: string,
    nonce: string,
    bZCert: BZECert,
    actionPayload: string, // base64 encoded bytes
}
interface SynAck extends BaseKeysplittingPayload {
    targetPublicKey: string,
    nonce: string,
    hPointer: string,
    actionResponsePayload: string // base64 encoded bytes
}
interface Data extends BaseKeysplittingPayload {
    targetId: string,
    hPointer: string,
    bZCertHash: string,
    actionPayload: string, // base64 encoded bytes
}
interface DataAck extends BaseKeysplittingPayload {
    targetPublicKey: string,
    hPointer: string,
    actionResponsePayload: string// base64 encoded bytes
}

interface SynPayload {
    targetUser: string
}
interface ShellInputPayload {
    data: string
}

interface ShellResizePayload {
	cols: number,
	rows: number
}

interface ShellReplayPayload {}

const KeysplittingHandshakeTimeout = 30; // in seconds
export class ShellWebsocketService
{
    private websocket : HubConnection;

    // Input subscriptions
    private inputSubscription: Subscription;
    private resizeSubscription: Subscription;

    // Output Observables
    private outputSubject: Subject<string>;
    public outputData: Observable<string>;

    public replayData: Observable<string>;

    private shellEventSubject: Subject<ShellEvent>;
    public shellEventData: Observable<ShellEvent>;

    private keysplittingHandshakeCompleteSubject = new Subject<boolean>();
    private keysplittingHandshakeComplete: Observable<boolean> = this.keysplittingHandshakeCompleteSubject.asObservable();

    private lastAckHPointer: string;
    private expectedHPointer: string;

    private currentInputMessage: KeysplittingMessage<Data>;
    private inputMessageBuffer: KeysplittingMessage<Data>[] = [];
    private outgoingShellMessages: { [h: string]: KeysplittingMessage<Data> } = {};

    private isActiveClient = false;
    private attaching = false;
    private refreshingBZCert = false;

    private currentIdToken: string = undefined;
    private targetPublicKey: ed.Point;
    private dataChannelId: string = uuidv4();

    constructor(
        private keySplittingService: KeySplittingService,
        private targetInfo: BzeroAgentSummary,
        private targetUser: string,
        private logger: ILogger,
        private authConfigService: AuthConfigService,
        private connectionId: string,
        private connectionNodeParameters: ConnectionNodeParameters,
        inputStream: Subject<string>,
        resizeStream: Subject<TerminalSize>
    ) {
        this.outputSubject = new Subject<string>();
        this.outputData = this.outputSubject.asObservable();
        this.shellEventSubject = new Subject<ShellEvent>();
        this.shellEventData = this.shellEventSubject.asObservable();
        this.targetPublicKey = ed.Point.fromHex(Buffer.from(this.targetInfo.agentPublicKey, 'base64').toString('hex'));

        this.connectionId = connectionId;
        this.inputSubscription = inputStream.asObservable().subscribe((data) => this.handleInput(data));
        this.resizeSubscription = resizeStream.asObservable().subscribe((data) => this.handleResize(data));
    }

    public async start()
    {
        this.logger.debug('Starting Websocket connection');
        this.websocket = await this.createConnection();

        // this is called if the server closes the websocket
        this.websocket.onclose((error) => {
            this.logger.debug(`websocket onclose event: ${error}`);

            if(error === undefined) {
                this.shellEventSubject.next({ type: ShellEventType.Closed });
            } else {
                this.shellEventSubject.next({ type: ShellEventType.Disconnect });
            }
        });

        this.websocket.onreconnecting(_ => {
            this.shellEventSubject.next({ type: ShellEventType.BrokenWebsocket });
        });

        this.websocket.onreconnected(_ => {
            this.logger.debug('Websocket reconnected');
        });

        // Make sure keysplitting service is initialized (keys loaded)
        await this.keySplittingService.init();

        this.websocket.on(DaemonHubIncomingMessages.shellMessage, (shellMessage) => this.handleAgentMessage(shellMessage));
        this.websocket.on(DaemonHubIncomingMessages.AttachToExistingDataChannel, (dataChannelId) => this.performMrZapHandshake(() => this.attachToExistingDataChannelHandler(dataChannelId)));
        this.websocket.on(DaemonHubIncomingMessages.OpenNewDataChannel, () => this.performMrZapHandshake(() => this.initDataChannel()));
        this.websocket.on(DaemonHubIncomingMessages.CloseConnection, () => this.destroyConnection());

        // Finally start the websocket connection
        await this.websocket.start();
        this.logger.debug('Websocket connection started');
        this.logger.debug(`Agent Version ${this.targetInfo.agentVersion}, Agent PublicKey: ${this.targetInfo.agentPublicKey}`);
    }

    private async initDataChannel() {
        this.logger.debug(`Initializing new data channel with agent`);

        const synMessage = await this.buildSyn();
        this.expectedHPointer = this.keySplittingService.getHPointer(synMessage.keysplittingPayload);

        const openDCMessage: OpenDataChannelPayload = {
            action: shellAction.Open,
            syn: Buffer.from(JSON.stringify(synMessage)).toString('base64')
        };

        const agentMessage : AgentMessage = {
            channelId: this.dataChannelId,
            messageType: 'openDataChannel',
            schemaVersion: '',
            messagePayload: Buffer.from(JSON.stringify(openDCMessage)).toString('base64')
        };

        await this.sendWebsocketMessage(DaemonHubOutgoingMessages.openDataChannel, agentMessage);
    }

    private async attachToExistingDataChannelHandler(dataChannelId: string) {
        this.logger.debug(`Attaching to existing data channel: ${dataChannelId}`);

        this.attaching = true;
        this.dataChannelId = dataChannelId;

        this.sendSynMessage();
    }

    private async performMrZapHandshake(startHandshakeFunc: () => Promise<void>): Promise<boolean> {
        const handShakePromise = new Promise(async (res, rej) => {
            this.keysplittingHandshakeComplete
                .pipe(timeout(KeysplittingHandshakeTimeout * 1000))
                .subscribe(
                    completedSuccessfully => {
                        res(completedSuccessfully);
                    },
                    _ => rej(`Keyspliting handshake timed out after ${KeysplittingHandshakeTimeout} seconds`)
                );

            // Start handshake
            await startHandshakeFunc();
        });

        // Catch any errors that occur during handshake and push to an error to
        // shellEventSubject
        try {
            await handShakePromise;
            return true;
        } catch(err) {
            this.shellEventSubject.error(err);
            return false;
        }
    }

    private async buildSyn(): Promise<KeysplittingMessage<Syn>> {
        this.currentIdToken = await this.authConfigService.getIdToken();

        const synPayload: SynPayload = {
            targetUser: this.targetUser
        };

        const synMessage: Syn = {
            timestamp: '',
            schemaVersion: this.keySplittingService.keysplittingVersion(),
            type: keysplittingType.Syn,
            action: shellAction.Open,
            actionPayload: Buffer.from(JSON.stringify(synPayload)).toString('base64'), // base64 encoded bytes
            targetId: this.targetInfo.agentPublicKey,
            nonce: this.keySplittingService.randomBytes(32).toString('base64'),
            bZCert: await (this.keySplittingService.getBZECert(this.currentIdToken))
        };

        const ksMessage: KeysplittingMessage<Syn> = {
            type: keysplittingType.Syn,
            keysplittingPayload: synMessage,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(synMessage))
        };

        return ksMessage;
    }

    private async sendShellOpen(): Promise<KeysplittingMessage<Data>> {
        this.currentIdToken = await this.authConfigService.getIdToken();

        const dataMessage: Data = {
            timestamp: '',
            schemaVersion: this.keySplittingService.keysplittingVersion(),
            type: keysplittingType.Data,
            action: shellAction.Open,
            actionPayload: '',
            targetId: this.targetInfo.agentPublicKey,
            hPointer: this.lastAckHPointer,
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        };

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: dataMessage,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(dataMessage))
        };

        this.sendDataMessage(ksMessage);

        return ksMessage;
    }

    private async handleAgentMessage(message: AgentMessage) {
        // turn our agent message MessagePayload into an object we can read
        const messagePayloadDecoded = Buffer.from(message.messagePayload, 'base64').toString();
        const messagePayload = JSON.parse(messagePayloadDecoded);

        switch (message.messageType) {
        case agentMessageType.error:
            this.logger.error(`${messagePayload.type}: ${messagePayload.message}`);
            // TODO: handle certain types of errors without force closing the shell connection?
            this.handleErrorAndClose(`Protocol Error: ${messagePayload.message}.`);
            break;
        case agentMessageType.keysplitting:

            this.logger.debug(`Received keysplitting message: ${messagePayload.type}`);
            const keysplittingMessage = messagePayload as KeysplittingMessage<any>;

            // Validate signature on all keysplitting messages
            if (await this.keySplittingService.validateSignature(keysplittingMessage.keysplittingPayload, keysplittingMessage.signature, this.targetPublicKey) != true) {
                const errorString = `Error Validating Signature on ${messagePayload.type} message!`;
                this.logger.error(errorString);
                throw new Error(errorString);
            }

            switch(messagePayload.type) {
            case keysplittingType.SynAck:
                const synAck = keysplittingMessage.keysplittingPayload as SynAck;

                // check to see if this is a message we sent
                const hPointer = synAck.hPointer;
                if (hPointer != this.expectedHPointer) {
                    this.isActiveClient = false; // we're no longer the one actively sending input
                    this.shellEventSubject.next({ type: ShellEventType.Unattached});
                    return;
                } else {
                    // if this is in response to something we sent, then we are the active client now
                    this.isActiveClient = true;
                }

                this.logger.debug('isActiveClient: '+ this.isActiveClient);

                // calculate the hash of the syn/ack
                this.lastAckHPointer = await this.keySplittingService.getHPointer(synAck);

                if (this.attaching) {
                    // if we're attaching then we need to get shell state by
                    // sending a replay data message
                    this.attaching = false;
                    this.sendShellReplay();
                } else if(this.refreshingBZCert) {
                    // if we are refreshing the bzcert then we are done once we
                    // receive the syn/ack
                    this.refreshingBZCert = false;
                    this.keysplittingHandshakeCompleteSubject.next(true);
                }  else {
                    // if we're not attaching or refreshing, we're opening a new
                    // shell on the target
                    this.sendShellOpen();
                }
                break;
            case keysplittingType.DataAck:
                const dataAckPayload = keysplittingMessage.keysplittingPayload as DataAck;

                // if we're not the active client we ignore all data/acks
                if (this.isActiveClient) {

                    this.logger.debug(`Received data ack message for action: ${dataAckPayload.action}`);

                    // Set lastAckHPointer to the most recent data/ack received
                    this.lastAckHPointer = await this.keySplittingService.getHPointer(messagePayload.keysplittingPayload);

                    switch(dataAckPayload.action) {
                    case shellAction.Replay:
                        this.outputSubject.next(dataAckPayload.actionResponsePayload);
                        this.keysplittingHandshakeCompleteSubject.next(true);
                        // Ready to start processing stdin
                        this.shellEventSubject.next({ type: ShellEventType.Start });
                        break;
                    case shellAction.Open:
                        this.keysplittingHandshakeCompleteSubject.next(true);
                        // Ready to start processing stdin
                        this.shellEventSubject.next({ type: ShellEventType.Start });
                        break;
                    case shellAction.Close:
                        break;
                    case shellAction.Input:
                    case shellAction.Resize:
                        await this.handleShellInputOrResizeDataAck(messagePayload.keysplittingPayload);
                        break;
                    default:
                        throw new Error(`Unrecognized data ack action: ${dataAckPayload.action}`);
                    }
                }
                break;
            default:
                this.logger.error('Received an unrecognized keysplitting message type ' + messagePayload.type);
            }
            break;

        case agentMessageType.stream:
            switch (messagePayload.type) {
            case steamMessageType.ShellQuit:
                this.shellEventSubject.next({ type: ShellEventType.Closed });
                await this.dispose();
                break;
            case steamMessageType.ShellStdOut:
                this.outputSubject.next(messagePayload.content);
                break;
            default:
                this.logger.error(`Unrecognized Agent Stream Message Type: ${messagePayload.type}`);
            }
            break;
        default:
            this.logger.error(`Unrecognized Agent Message Type: ${message.messageType}`);
        }
    }

    private async sendSynMessage() {
        const synMessage = await this.buildSyn();
        this.expectedHPointer = this.keySplittingService.getHPointer(synMessage.keysplittingPayload);
        await this.sendAgentMessage(synMessage);
    }

    private async sendDataMessage(dataMessage: KeysplittingMessage<Data>) {
        this.expectedHPointer = this.keySplittingService.getHPointer(dataMessage.keysplittingPayload);
        this.outgoingShellMessages[this.expectedHPointer] = dataMessage;

        await this.sendAgentMessage(dataMessage);
    }

    private async sendAgentMessage<TReq>(message: TReq) {
        // wrap our message in an Agent Message
        const agentMessage : AgentMessage = {
            channelId: this.dataChannelId,
            messageType: 'keysplitting',
            schemaVersion: this.keySplittingService.keysplittingVersion(),
            messagePayload: Buffer.from(JSON.stringify(message)).toString('base64')
        };

        await this.sendWebsocketMessage(DaemonHubOutgoingMessages.shellMessage, agentMessage);
    }

    private async handleInput(data: string): Promise<void> {
        this.logger.debug(`got new input ${data}`);

        // Skip new input messages if we are not the active client
        if(! this.isActiveClient) {
            this.logger.debug(`[handleInput] received when not active client...skipping.`);
            return;
        }

        const actionPayload: ShellInputPayload = {
            data: Buffer.from(data).toString('base64')
        };

        const ksPayload: Data = {
            timestamp: Date.now().toString(),
            schemaVersion: this.keySplittingService.keysplittingVersion(),
            type: keysplittingType.Data,
            action: shellAction.Input,
            actionPayload: Utils.JSONstringifyOrder(actionPayload).toString('base64'),
            targetId: this.targetInfo.agentPublicKey,
            hPointer: undefined, // will be set before sending
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        };

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: ksPayload,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(ksPayload))
        };

        this.inputMessageBuffer.push(ksMessage);
        await this.processInputMessageQueue();
    }


    private async processInputMessageQueue() {
        // currentInputMessage is empty (we already received the data ack for
        // the previous input message) AND we have more to send
        if (!this.currentInputMessage && this.inputMessageBuffer.length > 0) {
            this.currentInputMessage = this.inputMessageBuffer[0];

            // Check whether current BZCert's idtoken has been refreshed
            // If yes we need to perform a new handshake before sending data
            const IdToken = await this.authConfigService.getIdToken();
            if (this.currentIdToken != IdToken) {
                this.logger.debug(`Current id token has been refreshed, sending new syn message`);
                this.refreshingBZCert = true;
                if( ! await this.performMrZapHandshake(() => this.sendSynMessage())) return;
            }

            // Add hpointer and signature to the input data message before sending
            this.currentInputMessage.keysplittingPayload.hPointer = this.lastAckHPointer;
            this.currentInputMessage.signature = await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(this.currentInputMessage.keysplittingPayload));

            await this.sendDataMessage(this.currentInputMessage);
        }
    }

    private async handleShellInputOrResizeDataAck(dataAckMessage: DataAck) {
        const hPointer = dataAckMessage.hPointer;
        const inputMessage = this.outgoingShellMessages[hPointer];

        if(! inputMessage) {
            this.logger.error(`Unrecognized shell input data ack with hpointer ${hPointer}`);
            return;
        }

        if (inputMessage != this.currentInputMessage) {
            this.logger.error('Data ack is not for not the current input message');
            return;
        }

        // Remove from outgoing message map and input message buffer
        this.currentInputMessage = undefined;
        this.inputMessageBuffer.shift();
        delete this.outgoingShellMessages[dataAckMessage.hPointer];

        await this.processInputMessageQueue();
    }

    private async handleResize(terminalSize: TerminalSize): Promise<void> {
        this.logger.debug(`New terminal resize event (rows: ${terminalSize.rows} cols: ${terminalSize.columns})`);

        // Skip new resize messages if we are not the active client
        if(! this.isActiveClient) {
            this.logger.debug(`[handleResize] received when not active client...skipping.`);
            return;
        }

        const actionPayload: ShellResizePayload = {
            rows: terminalSize.rows,
            cols: terminalSize.columns
        };

        const ksPayload: Data = {
            timestamp: Date.now().toString(),
            schemaVersion: this.keySplittingService.keysplittingVersion(),
            type: keysplittingType.Data,
            action: shellAction.Resize,
            actionPayload: Utils.JSONstringifyOrder(actionPayload).toString('base64'),
            targetId: this.targetInfo.agentPublicKey,
            hPointer: undefined, // will be set before sending
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        };

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: ksPayload,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(ksPayload))
        };

        this.inputMessageBuffer.push(ksMessage);

        await this.processInputMessageQueue();
    }


    public async dispose() : Promise<void>
    {
        await this.destroyConnection();
        this.inputSubscription.unsubscribe();
        this.resizeSubscription.unsubscribe();
        this.shellEventSubject.complete();
    }

    private async sendWebsocketMessage(methodName: string, message: AgentMessage): Promise<void> {
        if(this.websocket === undefined || this.websocket.state == HubConnectionState.Disconnected)
            throw new Error('Hub disconnected');

        const response = await this.websocket.invoke<WebsocketResponse>(methodName, message);

        if(response && response.error) {
            this.logger.error(`Error invoking ${methodName}: ${response.errorMessage}`);
            this.handleErrorAndClose(response.errorMessage);
        }
    }

    private async createConnection(): Promise<HubConnection> {
        // connectionId is related to terminal session
        // connectionNodeAuthToken is used to authenticate the connection
        const queryString = `?connectionId=${this.connectionId}&authToken=${this.connectionNodeParameters.authToken}&connectionType=shell`;

        const connectionUrl = `${this.connectionNodeParameters.connectionServiceUrl}hub/daemon/${queryString}`;

        this.logger.debug('connecting with endpoint: ' + connectionUrl);

        return new HubConnectionBuilder()
            .withUrl(connectionUrl)
            .withAutomaticReconnect([100, 1000, 10000, 30000, 60000]) // retry times in ms
            .configureLogging(new SignalRLogger(this.logger, LogLevel.Warning))
            .build();
    }

    private async handleErrorAndClose(errorMsg: string) {
        this.shellEventSubject.error(`Error ${errorMsg}. Closing connection.`);
        await this.destroyConnection();
    }

    private async destroyConnection() {
        // TODO: close datachannel

        if(this.websocket) {
            await this.websocket.stop();
            this.websocket = undefined;
        }
    }

    public async sendShellReplay() {
        this.logger.debug('Sending shell replay data message');

        const actionPayload: ShellReplayPayload = {};

        const ksPayload: Data = {
            timestamp: Date.now().toString(),
            schemaVersion: this.keySplittingService.keysplittingVersion(),
            type: keysplittingType.Data,
            action: shellAction.Replay,
            actionPayload: Utils.JSONstringifyOrder(actionPayload).toString('base64'),
            targetId: this.targetInfo.agentPublicKey,
            hPointer: this.lastAckHPointer,
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        };

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: ksPayload,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(ksPayload))
        };

        await this.sendDataMessage(ksMessage);
    }
}