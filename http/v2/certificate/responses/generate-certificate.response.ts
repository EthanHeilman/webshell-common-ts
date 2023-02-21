export interface GenerateCertificateResponse {
    caCert: string
    serverCert?: string
    serverKey?: string
    keyShardData?: KeyShardData
    agentTargets: AgentTargetSummary[]
}

export interface KeyShardData {
    keys: MappedKeyShard[]
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