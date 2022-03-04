
import { Observable, Subject, Subscription } from 'rxjs';
import * as ed from 'noble-ed25519';
import { timeout } from 'rxjs/operators';
// import { ConnectionNodeParameters, ShellEvent, ShellEventType, ShellHubIncomingMessages, ShellHubOutgoingMessages, TerminalSize } from './ssm-shell-websocket.service.types';
import {DaemonHubOutgoingMessages, ShellEvent, ShellEventType, DaemonHubIncomingMessages, TerminalSize, ShellActions, ConnectionNodeParameters} from './shell-websocket.service.types';

import { AuthConfigService } from '../auth-config-service/auth-config.service';
import { ILogger } from '../logging/logging.types';
import { KeySplittingService } from '../keysplitting.service/keysplitting.service';
import { DataAckMessageWrapper, DataAckPayload, ErrorMessageWrapper, ShellTerminalSizeActionPayload, SsmTargetInfo, SynAckMessageWrapper, SynAckPayload, SynMessageWrapper, KeysplittingErrorTypes } from '../keysplitting.service/keysplitting-types';
// import {ShellActions}  from '../keysplitting.service/keysplitting-types';
import Utils from '../utility/utils';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { SignalRLogger } from '../logging/signalr-logger';
import { DataMessageWrapper, BZECert } from '../keysplitting.service/keysplitting-types';
import { v4 as uuidv4 } from 'uuid';


interface AgentMessage {
    channelId: string
    messageType: string
    schemaVersion: string
    messagePayload: string
}

const steamMessageType = {
    ShellStdOut: 'shell/stdout',
    ShellQuit: 'shell/quit'
}

const agentMessageType = {
    error: 'error',
    keysplitting: 'keysplitting',
    stream: 'stream'
}

const keysplittingType = {
    Syn: "Syn",
    SynAck: "SynAck",
    Data: "Data",
    DataAck: "DataAck"
}

const shellAction = {
    Open: "shell/open",
    Input: "shell/input",
    Replay: "shell/replay",
    Resize: "shell/resize",
    Close: "shell/close"
}

interface OpenDataChannelPayload {
    action: string,
    syn: string
}

interface KeysplittingMessage <TPayload> {
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

    private replaySubject: Subject<string>;
    public replayData: Observable<string>;

    private shellEventSubject: Subject<ShellEvent>;
    public shellEventData: Observable<ShellEvent>;

    private keysplittingHandshakeCompleteSubject = new Subject<boolean>();
    private keysplittingHandshakeComplete: Observable<boolean> = this.keysplittingHandshakeCompleteSubject.asObservable();

    private synShellOpenMessageHPointer: string;
    private synAckShellOpenMessageHPointer: string;
    private dataShellOpenMessageHPointer: string;
    private dataAckShellOpenMessageHPointer: string;

    // private sequenceNumber = 0;
    private currentInputMessage: KeysplittingMessage<Data>;
    // private outgoingShellInputMessages: { [h: string]: ShellMessage } = {};

    private lastAckHPointer: string;
    private hPointer: string;
    private expectedHPointer: string;

    private inputMessageBuffer: KeysplittingMessage<Data>[] = [];
    private outgoingShellInputMessages: { [h: string]: KeysplittingMessage<Data> } = {};

    private isActiveClient = false;

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
        this.shellEventSubject = new Subject<ShellEvent>();
        this.shellEventData = this.shellEventSubject.asObservable();

        this.connectionId = connectionId;
        this.inputSubscription = inputStream.asObservable().subscribe((data) => this.handleInput(data));
        this.resizeSubscription = resizeStream.asObservable().subscribe((data) => this.handleResize(data));
    }

    public async start()
    {
        this.logger.info("Starting Websocket connection");
        this.websocket = await this.createConnection();

        // TODO: ~ERH I think we can remove this
        // this.websocket.on(
        //     DaemonHubIncomingMessages.shellMessage,
        //     req =>
        //     {
        //         // ref: https://git.coolaj86.com/coolaj86/atob.js/src/branch/master/node-atob.js
        //         this.outputSubject.next(req.data);
        //     }
        // );



        // // this is called if the server closes the websocket
        this.websocket.onclose(() => {
            this.logger.debug('websocket closed by server');
            this.shellEventSubject.next({ type: ShellEventType.Disconnect });
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

        // Finally start the websocket connection
        await this.websocket.start();
        this.logger.info("Websocket connection started");

        await this.initDataChannel();

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

    private async buildSyn(): Promise<KeysplittingMessage<Syn>> {
        this.currentIdToken = await this.authConfigService.getIdToken();

        const synPayload: SynPayload = {
            targetUser: "ec2-user"
        }
        
        const synMessage: Syn = {
            timestamp: "",
            schemaVersion: "",
            type: keysplittingType.Syn,
            action: shellAction.Open,
            actionPayload: Buffer.from(JSON.stringify(synPayload)).toString('base64'), // base64 encoded bytes
            targetId: "",
            nonce: this.keySplittingService.randomBytes(32).toString('base64'),
            bZCert: await (this.keySplittingService.getBZECert(this.currentIdToken))
        }

        const ksMessage: KeysplittingMessage<Syn> = {
            type: keysplittingType.Syn,
            keysplittingPayload: synMessage,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(synMessage))
        }
        return ksMessage
    }

    private async sendShellOpen(): Promise<KeysplittingMessage<Data>> {
        this.currentIdToken = await this.authConfigService.getIdToken();

        const dataMessage: Data = {
            timestamp: "",
            schemaVersion: "",
            type: keysplittingType.Data,
            action: shellAction.Open,
            actionPayload: "", //Buffer.from(JSON.stringify(dataPayload)).toString('base64'), // base64 encoded bytes
            targetId: "",
            hPointer: this.lastAckHPointer,
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        }

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: dataMessage,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(dataMessage))
        }

        this.logger.info(JSON.stringify(ksMessage));
        this.expectedHPointer = this.keySplittingService.getHPointer(ksMessage.keysplittingPayload)
        let expectedHPointer = this.keySplittingService.getHPointer(ksMessage.keysplittingPayload)
        this.outgoingShellInputMessages[expectedHPointer] = ksMessage;

        this.sendMessage<KeysplittingMessage<Data>>(ksMessage);

        return ksMessage
    }

    private async initDataChannel() {
        const synMessage = await this.buildSyn();
        this.expectedHPointer = this.keySplittingService.getHPointer(synMessage.keysplittingPayload)
        let expectedHPointer = this.keySplittingService.getHPointer(synMessage.keysplittingPayload)
        this.outgoingShellInputMessages[expectedHPointer] = this.currentInputMessage;


        this.logger.info("SYN: " + JSON.stringify(synMessage))

        const openDCMessage: OpenDataChannelPayload = {
            action: shellAction.Open,
            syn: Buffer.from(JSON.stringify(synMessage)).toString('base64')
        }

        const agentMessage : AgentMessage = {
            channelId: this.dataChannelId,
            messageType: "openDataChannel",
            schemaVersion: "",
            messagePayload: Buffer.from(JSON.stringify(openDCMessage)).toString('base64')
        }

        await this.sendWebsocketMessage(DaemonHubOutgoingMessages.openDataChannel, agentMessage);
    }

    private async handleAgentMessage(message: AgentMessage) {
        const messagePayload = Buffer.from(message.messagePayload, 'base64').toString()
        const parsedMessage = JSON.parse(messagePayload);



        switch (message.messageType) {
            case agentMessageType.error:
                this.logger.error(parsedMessage.type + ": " + parsedMessage.message);
                // if the parsed message type is a keysplitting error, then we want to resend syn
                break;
            case agentMessageType.keysplitting:


                switch(parsedMessage.type) {
                    case keysplittingType.SynAck:
                        this.logger.debug("SYNACK recieved");
                        let hPointer = parsedMessage.keysplittingPayload.hPointer;
                        if (this.outgoingShellInputMessages[hPointer]){
                            this.logger.debug('Received message from another client.');
                            this.isActiveClient = false;
                            this.shellEventSubject.next({ type: ShellEventType.Unattached});
                            return;
                        } else {
                            this.isActiveClient = true;
                        }

                        this.lastAckHPointer = await this.keySplittingService.getHPointer(parsedMessage.keysplittingPayload);
                        this.sendShellOpen();
                        this.shellEventSubject.next({ type: ShellEventType.Start });
                        break;
                    case keysplittingType.DataAck:

                        this.lastAckHPointer = await this.keySplittingService.getHPointer(parsedMessage.keysplittingPayload);
                        
                        if (parsedMessage.keysplittingPayload.action == "shell/replay") {
                            var termoutBuff = Buffer.from(parsedMessage.keysplittingPayload.actionResponsePayload, 'base64').toString()
                            // this.outputSubject.next(termoutBuff);
                            this.logger.error("replay: "+termoutBuff)
                        }
                        await this.handleShellInputOrResizeDataAck(parsedMessage.keysplittingPayload);

                        break;
                    default:
                        this.logger.error("Recieved an unrecognized keysplitting message type " + parsedMessage.type)
                }
                break;
                case agentMessageType.stream:    
                    switch (parsedMessage.type) {
                        case steamMessageType.ShellQuit:
                            this.shellEventSubject.next({ type: ShellEventType.Disconnect });
                            // this.dispose();
                            break;
                        case steamMessageType.ShellStdOut:
                            this.outputSubject.next(parsedMessage.content);
                            break;
                        default:
                            this.logger.error("Unrecognised Stream Message Type")
                    }
                    break;
                default:
                    this.logger.error("Recognised Agent Message Type")
            }

        try {
            // this.logger.debug(`Received SynAck message: ${JSON.stringify(synAckMessage)}`);

            // // For now we only only a single client to be attached to the shell
            // // at a time so if we see another synack message we dont recognize
            // // immediately disconnect
            // if (synAckMessage.synAckPayload.payload.hPointer != this.synShellOpenMessageHPointer) {
            //     this.logger.debug('[SynAck] received message from another client.');
            //     this.isActiveClient = false;
            //     this.shellEventSubject.next({ type: ShellEventType.Unattached});
            //     return;
            // }

            // // For out SynAck message we need to set the public key of the target
            // const pubkey = synAckMessage.synAckPayload.payload.targetPublicKey;
            // this.targetPublicKey = ed.Point.fromHex(Buffer.from(pubkey, 'base64').toString('hex'));

            // // Validate our signature
            // if (await this.keySplittingService.validateSignature<SynAckPayload>(synAckMessage.synAckPayload, this.targetPublicKey) != true) {
            //     const errorString = '[SynAck] Error Validating Signature!';
            //     this.logger.error(errorString);
            //     throw new Error(errorString);
            // }

            // this.synAckShellOpenMessageHPointer = this.keySplittingService.getHPointer(synAckMessage.synAckPayload.payload);
            // this.lastAckHPointer = this.synAckShellOpenMessageHPointer;
            this.isActiveClient = true;

            // await this.sendShellOpenDataMessage();
        } catch(e) {
            this.logger.error(`Error in handleSynAck: ${e}`);
        }
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

        // Skip new input messages if we are not the active client
        if(! this.isActiveClient) {
            this.logger.debug(`[handleInput] received when not active client...skipping.`);
            return;
        }        

        const actionPayload: ShellInputPayload = {
            data: Buffer.from(data).toString('base64') 
        }

        const ksPayload: Data = {
            timestamp: Date.now().toString(),
            schemaVersion: "",
            type: keysplittingType.Data,
            action: shellAction.Input,
            actionPayload: Utils.JSONstringifyOrder(actionPayload).toString('base64'),
            targetId: "",
            hPointer: "not set",
            // hPointer: this.lastAckHPointer,
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        }

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: ksPayload,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(ksPayload))
        }

        this.inputMessageBuffer.push(ksMessage);
        await this.processInputMessageQueue();
    }


    private async processInputMessageQueue() {
        // Check whether current BZCert's idtoken has been refreshed
        // If yes we need to perform a new handshake before sending data
        const IdToken = await this.authConfigService.getIdToken();
        if (this.currentIdToken !== IdToken){
            this.logger.debug(`Current id token has expired, requesting new and performing new mrzap handshake`);
            await this.performMrZAPHandshake();
        }


        // currentInputMessage is empty AND we have more to send
        if (!this.currentInputMessage && this.inputMessageBuffer.length > 0) {
            this.currentInputMessage = this.inputMessageBuffer[0];

            // await this.sendShellInputDataMessage(this.currentInputMessage);
            this.currentInputMessage.keysplittingPayload.hPointer = this.lastAckHPointer;
            this.currentInputMessage.signature = await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(this.currentInputMessage.keysplittingPayload))

            this.expectedHPointer = this.keySplittingService.getHPointer(this.currentInputMessage.keysplittingPayload)
            let expectedHPointer = this.keySplittingService.getHPointer(this.currentInputMessage.keysplittingPayload)
            this.outgoingShellInputMessages[expectedHPointer] = this.currentInputMessage;

            await this.sendMessage<KeysplittingMessage<Data>>(this.currentInputMessage);
        }
    }


    private async handleShellInputOrResizeDataAck(dataAckMessage: DataAck) {
        // this.logger.error(`dataAckMessagedataAckMessagedataAckMessage ${dataAckMessage}`);

        const hPointer = dataAckMessage.hPointer;
        const inputMessage = this.outgoingShellInputMessages[hPointer];
        if(! inputMessage) {
            this.logger.error(`Unrecognized shell input data ack with hpointer ${hPointer}`);
            return;
        }

        // if (inputMessage != this.currentInputMessage) {
        //     this.logger.error('Data ack is not for not the current input message');
        //     return;
        // }

        // this.lastAckHPointer = this.keySplittingService.getHPointer(dataAckMessage.actionResponsePayload);
        // this.expectedHPointer = this.keySplittingService.getHPointer(dataAckMessage.actionResponsePayload);
        this.lastAckHPointer =  this.keySplittingService.getHPointer(dataAckMessage);

        // Remove from outgoing message map and input message buffer
        this.currentInputMessage = undefined;
        this.inputMessageBuffer.shift();
        delete this.outgoingShellInputMessages[dataAckMessage.hPointer];

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
        }

        const ksPayload: Data = {
            timestamp: Date.now().toString(),
            schemaVersion: "",
            type: keysplittingType.Data,
            action: shellAction.Resize,
            actionPayload: Utils.JSONstringifyOrder(actionPayload).toString('base64'),
            targetId: "",
            hPointer: "not set",
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        }

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: ksPayload,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(ksPayload))
        }

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

    public async shellReplay() {
        this.logger.error("Running replay");

        const actionPayload: ShellReplayPayload = {}

        const ksPayload: Data = {
            timestamp: Date.now().toString(),
            schemaVersion: "",
            type: keysplittingType.Data,
            action: shellAction.Replay,
            actionPayload: Utils.JSONstringifyOrder(actionPayload).toString('base64'),
            targetId: "",
            hPointer: "not set",
            bZCertHash: await this.keySplittingService.getBZECertHash(this.currentIdToken)
        }

        const ksMessage: KeysplittingMessage<Data> = {
            type: keysplittingType.Data,
            keysplittingPayload: ksPayload,
            signature: await this.keySplittingService.signHelper(Utils.JSONstringifyOrder(ksPayload))
        }

        this.inputMessageBuffer.push(ksMessage);
        await this.processInputMessageQueue();
    }

    private resetKeysplittingState() {
        this.currentInputMessage = undefined;
        this.lastAckHPointer = undefined;
        this.inputMessageBuffer = [];
        this.outgoingShellInputMessages = {};
        this.isActiveClient = false;
    }

    public async shellReattach(): Promise<void> {
        if(this.isActiveClient) {
            this.logger.warn('Cannot reattach shell already the active client');
            return;
        }

        this.resetKeysplittingState();
        // await this.performKeysplittingHandshake();
    }
}