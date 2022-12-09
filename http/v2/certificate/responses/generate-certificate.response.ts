export interface GenerateCertificateResponse {
    caCert: string
    serverCert?: string
    serverKey?: string
    agentKeyShard?: MappedKeyShard
    agentTargets: AgentTargetSummary[]
}

export interface MappedKeyShard {
    key: string
    targetIds: string[]
}

export interface AgentTargetSummary {
    name: string
    envId: string
    dbTargets: string[]
}