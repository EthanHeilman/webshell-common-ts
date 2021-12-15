export interface RegisterDynamicAccessConfigRequest {
    name: string;
    startWebhook: string;
    stopWebhook: string;
    healthWebhook: string;
    environmentId: string;
    sharedSecret?: string;
}