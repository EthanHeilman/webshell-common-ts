import { IdentityProvider } from '../../../../auth-service/auth.types';

export interface IdentityProviderGroupsMetadataResponse {
    customerId: string;
    creationDate: Date;
    lastUpdateDate: Date;
    adminEmail: string;
    userReadonlyScope: boolean;
    groupReadonlyScope: boolean;
    externalIdentityProviderType: IdentityProvider;
}
