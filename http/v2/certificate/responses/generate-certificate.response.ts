export interface GenerateCertificateResponse {
    caCert: string
    serverCert?: string
    serverKey?: string
    agentKeyShard?: string // string represntation of a bigint
}