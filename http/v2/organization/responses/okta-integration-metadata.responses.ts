import { IdentityProvider } from '../../../../auth-service/auth.types';

export interface OktaIntegrationMetadataResponse {
    clientId: string;
    creationDate: Date;
    lastUpdateDate: Date;
    adminEmail: string;
    userReadonlyScope: boolean;
    groupReadonlyScope: boolean;
    externalIdentityProviderType: IdentityProvider;
}
