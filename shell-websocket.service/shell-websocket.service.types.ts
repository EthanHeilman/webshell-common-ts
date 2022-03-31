import { IDisposableAsync } from '../utility/disposable';
import { Observable } from 'rxjs';
export interface IShellWebsocketService extends IDisposableAsync{
    start() : Promise<void>;
    dispose() : Promise<void>

    outputData: Observable<string>;
    replayData: Observable<string>;
    shellEventData: Observable<ShellEvent>;
}

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

export enum ShellActions {
    Open = 'shell/open',
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
    shellMessage: 'ResponseBastionToDaemonV1',
    OpenNewDataChannel: 'OpenNewDataChannel',
    AttachToExistingDataChannel: 'AttachToExistingDataChannel',
    CloseConnection: 'CloseConnection'
};

export const DaemonHubOutgoingMessages = {
    openDataChannel: 'OpenDataChannelDaemonToBastionV1',
    closeDataChannel: 'CloseDataChannelDaemonToBastionV1',
    shellMessage: 'RequestDaemonToBastionV1'
};


