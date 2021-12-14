export interface RegisterSsmTargetRequest { 
    registrationId: string;
    registrationSecret: string;
    instanceName: string;
    environmentId?: string;
}