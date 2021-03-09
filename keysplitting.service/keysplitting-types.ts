export interface BZECert {
    initialIdToken: string,
    currentIdToken: string,
    clientPublicKey: string,
    rand: string,
    signatureOnRand: string
}

export interface KeySplittingPayload {
    type: string, 
    action: string
}

export interface KeySplittingMessage<TPayload> {
    payload: TPayload,
    signature: string
}
export interface SynMessagePayload extends KeySplittingPayload {
    nonce: string, 
    targetId: string, 
    BZECert: BZECert
}

export interface DataMessagePayload extends KeySplittingPayload {
    targetId: string, 
    hPointer: string,
    payload: string, 
    BZECert: string
}
export interface SynAckPayload extends KeySplittingPayload {
    hPointer: string,
    nonce: string, 
    targetPublicKey: string
}

export interface DataAckPayload extends KeySplittingPayload {
    hPointer: string, 
    payload: string, 
    targetPublicKey: string
}

export interface ErrorPayload {
    hPointer: string;
    message: string;
}

export interface DataAckMessage extends KeySplittingMessage<DataAckPayload> { }

export interface SynMessage extends KeySplittingMessage<SynMessagePayload> { }

export interface SynAckMessage extends KeySplittingMessage<SynAckPayload> { }

export interface DataMessage extends KeySplittingMessage<DataMessagePayload> { }

export interface ErrorPayload extends KeySplittingMessage<ErrorPayload> { }

export interface SynMessageWrapper {
    synPayload: SynMessage
}

export interface DataMessageWrapper {
    dataPayload: DataMessage
}

export interface DataAckMessageWrapper {
    dataAckPayload: DataAckMessage
}

export interface SynAckMessageWrapper {
    synAckPayload: SynAckMessage
}