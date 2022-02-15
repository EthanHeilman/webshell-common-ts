import { IDisposableAsync } from '../utility/disposable';
import { Observable } from 'rxjs';
export interface IShellWebsocketService extends IDisposableAsync{
    start() : Promise<void>;
    dispose() : Promise<void>

    // updateTargetInfo(targetInfo: SsmTargetInfo): void;

    // Terminal dimensions provided in the shell connect are only used for the
    // virtual terminal emulator for command extraction. Keysplitting shells
    // must send a separate resize input event
    // sendShellConnect(rows: number, cols: number, replayOutput: boolean): void;

    // sendReplayDone(rows: number, cols: number): void;

    // shellReattach() : Promise<void>;

    outputData: Observable<string>;
    // replayData: Observable<string>;
    // shellEventData: Observable<ShellEvent>;
}

export enum ShellActions {
    // Open = 'shell/open',
    Input = 'shell/input',
    Resize = 'shell/resize'
}

export interface TerminalSize
{
    rows: number;
    columns: number;
}

export interface ConnectionNodeParameters
{
    authToken: string;
    connectionServiceUrl: string;
}

export const DaemonHubIncomingMessages = {
    shellMessage: 'ResponseBastionToDaemonV1'

    // shellOutput: 'ShellOutput',
    // shellReplay: 'ShellReplay',
    // shellDisconnect: 'ShellDisconnect',
    // shellStart: 'ShellStart',
    // shellDelete: 'ShellDelete',
    // connectionReady: 'ConnectionReady',

    // // keysplitting
    // synAck: 'SynAck',
    // dataAck: 'DataAck',
    // keysplittingError: 'KeysplittingError',
};

export const DaemonHubOutgoingMessages = {
    openDataChannel: 'OpenDataChannelDaemonToBastionV1',
    closeDataChannel: 'CloseDataChannelDaemonToBastionV1',
    shellMessage: 'RequestDaemonToBastionV1',

    // shellConnect: 'ShellConnect',
    // replayDone: 'ReplayDone',
    // shellInput: 'ShellInput',
    // shellGeometry: 'ShellGeometry',

    // // keysplitting
    // synMessage: 'SynMessage',
    // dataMessage: 'DataMessage',
};


