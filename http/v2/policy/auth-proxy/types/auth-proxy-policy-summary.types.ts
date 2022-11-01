import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { PolicyType } from '../../types/policy-type.types';
import { TargetUser } from '../../types/target-user.types';
import { Environment } from '../../types/environment.types';
import { Target } from '../../types/target.types';

export interface AuthProxyPolicySummary extends BasePolicySummary {
    type: PolicyType.AuthProxy;

    /**
     * Environments this policy applies to.
     */
    environments: Environment[];
    /**
     * Targets this policy applies to.
     */
    targets: Target[];
    /**
     * Target users allowed by this policy.
     */
    targetUsers: TargetUser[];
}