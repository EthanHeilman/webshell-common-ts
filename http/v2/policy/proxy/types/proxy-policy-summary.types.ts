import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { Environment } from '../../types/environment.types';
import { PolicyType } from '../../types/policy-type.types';
import { TargetUser } from '../../types/target-user.types';
import { Target } from '../../types/target.types';

export interface ProxyPolicySummary extends BasePolicySummary {
    type: PolicyType.Proxy;

    /**
     * Environments this policy applies to.
     */
    environments: Environment[];
    /**
     * Targets this policy applies to.
     */
    targets: Target[];
    /**
     * Users allowed access on the target. NOTE: only applies to passwordless database targets.
     */
    targetUsers?: TargetUser[];
}