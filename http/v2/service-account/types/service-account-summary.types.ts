export interface ServiceAccountSummary {
    id: string;
    organizationId: string;
    email: string;
    externalId: string;
    jwksUrl: string;
    jwksUrlPattern: string;
    isAdmin: boolean;
    timeCreated: Date;
    lastLogin: Date;
    createdBy: string;
    enabled: boolean;
 }