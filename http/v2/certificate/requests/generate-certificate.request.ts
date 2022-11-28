export interface GenerateCertificateRequest {
    targetNames: string[]
    targetIds: string[]
    envName?: string
    envId?: string
    all: boolean
    selfHosted: boolean
    returnAgentKey: boolean
}