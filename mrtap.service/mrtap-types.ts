export interface SsmTargetInfo {
    id: string;
    agentId: string;
    agentVersion: string;
}

export interface BZECert {
    initialIdToken: string;
    currentIdToken: string;
    clientPublicKey: string;
    rand: string;
    signatureOnRand: string;
}

export interface MrtapPayload {
    type: string;
    action: string;
}

export interface MrtapMessage<TPayload> {
    payload: TPayload;
    signature: string;
}
export interface SynMessagePayload extends MrtapPayload {
    nonce: string;
    targetId: string;
    BZECert: BZECert;
}

export interface DataMessagePayload extends MrtapPayload {
    targetId: string;
    hPointer: string;
    payload: string;
    BZECert: string;
}
export interface SynAckPayload extends MrtapPayload {
    hPointer: string;
    nonce: string;
    targetPublicKey: string;
}

export interface DataAckPayload extends MrtapPayload {
    hPointer: string;
    payload: string;
    targetPublicKey: string;
}

export interface ErrorPayload {
    hPointer: string;
    message: string;
    targetPublicKey: string;
    errorType: string;
}

export interface DataAckMessage extends MrtapMessage<DataAckPayload> { }

export interface SynMessage extends MrtapMessage<SynMessagePayload> { }

export interface SynAckMessage extends MrtapMessage<SynAckPayload> { }

export interface DataMessage extends MrtapMessage<DataMessagePayload> { }

export interface ErrorMessage extends MrtapMessage<ErrorPayload> { }

export interface SynMessageWrapper {
    synPayload: SynMessage;
}

export interface DataMessageWrapper {
    dataPayload: DataMessage;
}

export interface DataAckMessageWrapper {
    dataAckPayload: DataAckMessage;
}

export interface SynAckMessageWrapper {
    synAckPayload: SynAckMessage;
}

export interface ErrorMessageWrapper {
    errorPayload: ErrorMessage;
}

// Should be kept in sync with agent error types from
// https://github.com/bastionzero/bzero-ssm-agent/blob/d5fac61c89b3b2af90faf2a3eec07e55ae123583/agent/keysplitting/contracts/model.go#L117-L133
// Updated as of agent version 3.0.732.21
export enum MrtapErrorTypes {
    BZECertInvalidIDToken = 'BZECertInvalidIDToken',
    BZECertInvalidNonce = 'BZECertInvalidNonce',
    BZECertUnrecognized = 'BZECertUnrecognized',
    BZECertInvalidProvider = 'BZECertProviderError',
    BZECertExpired = 'BZECertExpired',
    HPointerError = 'HPointerError',
    SigningError = 'SigningError',
    SignatureVerificationError = 'SignatureVerificationError',
    TargetIdInvalid = 'TargetIdInvalid',
    HashingError = 'HashingError',
    MrtapActionError = 'MrtapActionError',
    InvalidPayload = 'InvalidPayload',
    Unknown = 'Unknown',
    ChannelClosed = 'ChannelClosed',
    OutdatedHPointer = 'OutdatedHPointer',
    BZECertExpiredInitialIdToken = 'BZECertExpiredInitialIdToken',
    HandlerNotReady = 'HandlerNotReady',
    FUDFileDoesNotExist = 'FUDFileDoesNotExist',
    FUDUserDoesNotHavePermission = 'FUDUserDoesNotHavePermission',
    FUDInvalidDestinationPath = 'FUDInvalidDestinationPath'
}

export enum SshTunnelActions {
    Open = 'ssh/open'
}

export interface SshOpenActionPayload {
    username: string;
    sshPubKey: string;
}

export enum ShellActions {
    Open = 'shell/open',
    Input = 'shell/input',
    Resize = 'shell/resize'
}

export enum FudActions {
    Download = 'fud/download',
    Upload = 'fud/upload'
}

export interface ShellTerminalSizeActionPayload {
    rows: number;
    cols: number;
}