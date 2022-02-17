export interface EditDynamicAccessConfigRequest {
    name?: string;
    startWebhook?: string;
    stopWebhook?: string;
    healthWebhook?: string;
    sharedSecret?: string;
}
