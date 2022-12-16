import { TargetUser } from '../../policy/types/target-user.types';
export interface ProxyPolicyQueryResponse {
    allowed: boolean;
    allowedPolicies: string[];
    allowedTargetUsers: TargetUser[];
}