import { TargetRole } from '../../policy/types/target-role.types';
export interface ProxyPolicyQueryResponse {
    allowed: boolean;
    allowedPolicies: string[];
    allowedTargetRoles: TargetRole[];
}