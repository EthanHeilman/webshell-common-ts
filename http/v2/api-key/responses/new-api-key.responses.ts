import { ApiKeySummary } from '../types/api-key-summary.types';

export interface NewApiKeyResponse {
     apiKeyDetails: ApiKeySummary;
     secret: string;
 }