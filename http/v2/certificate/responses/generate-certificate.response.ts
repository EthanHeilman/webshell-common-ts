export interface GenerateCertificateResponse {
    caCert: string
    serverCert?: string
    serverKey?: string
    agentKeyShard?: MappedKeyShard
}

export interface MappedKeyShard {
    key: AgentKeyShard
    targetIds: string[]
}

export interface AgentKeyShard {
    d: string
    e: string
    eSplit: string
    n: string
}