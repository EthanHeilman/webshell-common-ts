import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { Environment } from '../../types/environment.types';
import { PolicyType } from '../../types/policy-type.types';
import { TargetRole } from '../../types/target-role.types';
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
     * Roles allowed access on the target. NOTE: only applies to passwordless database targets.
     */
    targetRoles?: TargetRole[];
}