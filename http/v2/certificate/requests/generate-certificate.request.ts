export interface GenerateCertificateRequest {
    targetNames: string[]
    targetIds: string[]
    envName?: string
    envId?: string
    selfHosted: boolean
    returnAgentKey: boolean
}