import { PolicySummary } from 'services/v1/policy/policy.types';

export interface GetKubePoliciesResponse {
    policies: PolicySummary[]
}