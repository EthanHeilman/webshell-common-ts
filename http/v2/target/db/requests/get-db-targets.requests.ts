export interface GetDbTargetsRequest {
    targetNames: string[]
    targetIds: string[]
    envName?: string
    envId?: string
}