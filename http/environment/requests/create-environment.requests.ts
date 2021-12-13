export interface CreateEnvironmentRequest {
    name: string;
    description?: string;
    offlineCleanupTimeoutHours: number;
}