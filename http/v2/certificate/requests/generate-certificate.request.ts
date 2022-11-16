export interface GenerateCertificateRequest {
    targetNames: string[]
    targetIds: string[]
    envName?: string
    envId?: string
}