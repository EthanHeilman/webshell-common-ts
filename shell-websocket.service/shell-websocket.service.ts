
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

interface AgentMessage {
    channelId: string
    messageType: string
    schemaVersion: string
    messagePayload: string
}

interface ShellMessage {
    inputType: ShellActions,
    inputPayload: any;
}
export class ShellWebsocketService
{
    private websocket : HubConnection;

    // Input subscriptions
    // private inputSubscription: Subscription;
    // private resizeSubscription: Subscription;

    // Output Observables
    // private outputSubject: Subject<string>;
    // public outputData: Observable<string>;

    // private replaySubject: Subject<string>;
    // public replayData: Observable<string>;

    // private shellEventSubject: Subject<ShellEvent>;
    // public shellEventData: Observable<ShellEvent>;

    // private keysplittingHandshakeCompleteSubject = new Subject<boolean>();
    // private keysplittingHandshakeComplete: Observable<boolean> = this.keysplittingHandshakeCompleteSubject.asObservable();

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

    // private currentIdToken: string = undefined;
    // private targetPublicKey: ed.Point;

    constructor(
        private keySplittingService: KeySplittingService,
        // private targetInfo: SsmTargetInfo,
        private logger: ILogger,
        private authConfigService: AuthConfigService,
        private connectionId: string,
        private connectionNodeParameters: ConnectionNodeParameters,
        // inputStream: Subject<string>,
        // resizeStream: Subject<TerminalSize>
    ) {
        // this.outputSubject = new Subject<string>();
        // this.outputData = this.outputSubject.asObservable();
        // this.shellEventSubject = new Subject<ShellEvent>();
        // this.shellEventData = this.shellEventSubject.asObservable();

        this.connectionId = connectionId;
        // this.inputSubscription = inputStream.asObservable().subscribe((data) => this.handleInput(data));
        // this.resizeSubscription = resizeStream.asObservable().subscribe((data) => this.handleResize(data));
    }

    public async start()
    {
        this.logger.info("creating connection");
        this.websocket = await this.createConnection();
        this.logger.info("connection created!!!!!!!");

        // this.websocket.on(
        //     DaemonHubIncomingMessages.shellMessage,
        //     req =>
        //     {
        //         // ref: https://git.coolaj86.com/coolaj86/atob.js/src/branch/master/node-atob.js
        //         this.outputSubject.next(req.data);
        //     }
        // );

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

        // this.websocket.on(DaemonHubIncomingMessages.shellMessage, (shellMessage) => this.handleShellMessage(shellMessage));

        // Finally start the websocket connection
        await this.websocket.start();

        this.logger.info("WEBSOCKET STARTED")
        
        // for testing purposes, send something
    }

    public async dispose() : Promise<void>
    {
        await this.destroyConnection();
        // this.inputSubscription.unsubscribe();
        // this.resizeSubscription.unsubscribe();
        // this.shellEventSubject.complete();
    }

    private async sendWebsocketMessage<TReq>(methodName: string, message: TReq): Promise<void> {
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
            .configureLogging(new SignalRLogger(this.logger, LogLevel.Warning))
            .build();
    }

    private async destroyConnection() {
        if(this.websocket) {
            await this.websocket.stop();
            this.websocket = undefined;
        }
    }
}