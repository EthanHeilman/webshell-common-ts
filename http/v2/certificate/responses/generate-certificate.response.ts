export interface GenerateCertificateResponse {
    caCert: string
    serverCert?: string
    serverKey?: string
    agentKeyShard?: KeyShard
}

export interface KeyShard {
    d: string
    e: string
    eSplit: string
    n: string
}