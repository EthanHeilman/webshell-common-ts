import { Observable } from 'rxjs';
import { SsmTargetInfo } from '../mrtap.service/mrtap-types';
import { IDisposableAsync } from '../utility/disposable';

export interface ISsmShellWebsocketService extends IDisposableAsync {
    start(): Promise<void>;

    updateTargetInfo(targetInfo: SsmTargetInfo): void;

    // Terminal dimensions provided in the shell connect are only used for the
    // virtual terminal emulator for command extraction. MrTAP shells
    // must send a separate resize input event
    sendShellConnect(rows: number, cols: number, replayOutput: boolean): void;

    sendReplayDone(rows: number, cols: number): void;

    shellReattach(): Promise<void>;

    outputData: Observable<string>;
    replayData: Observable<string>;
    shellEventData: Observable<ShellEvent>;
}

export const ShellHubIncomingMessages = {
    shellOutput: 'ShellOutput',
    shellReplay: 'ShellReplay',
    shellDisconnect: 'ShellDisconnect',
    shellStart: 'ShellStart',
    shellDelete: 'ShellDelete',
    connectionReady: 'ConnectionReady',

    // MrTAP
    synAck: 'SynAck',
    dataAck: 'DataAck',
    keysplittingError: 'KeysplittingError',
};

export const ShellHubOutgoingMessages = {
    shellConnect: 'ShellConnect',
    replayDone: 'ReplayDone',
    shellInput: 'ShellInput',
    shellGeometry: 'ShellGeometry',

    // MrTAP
    synMessage: 'SynMessage',
    dataMessage: 'DataMessage',
};

export enum ShellEventType {
    Start = 'Start',
    Disconnect = 'Disconnect',
    Delete = 'Delete',
    Ready = 'Ready',
    Unattached = 'Unattached',
    BrokenWebsocket = 'BrokenWebsocket'
}

export interface ShellEvent {
    type: ShellEventType;
}

export interface TerminalSize {
    rows: number;
    columns: number;
}

export interface ConnectionNodeParameters {
    authToken: string;
    connectionServiceUrl: string;
}