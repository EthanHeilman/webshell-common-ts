import { ServiceAccountSummary } from '../types/service-account-summary.types';

export interface CreateServiceAccountResponse {
    serviceAccountSummary: ServiceAccountSummary;
    mfaSecret: string;
}