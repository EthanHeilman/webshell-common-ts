export interface GenerateCertificateResponse {
    caCert: string
    serverCert?: string
    serverKey?: string
    agentKeyShard?: KeyShard // JSON represntation of a private key... actually TODO: might as well make it a struct
}

export interface KeyShard {
    d: string
    e: string
    eSplit: string
    n: string
}