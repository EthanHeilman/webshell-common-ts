import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { PolicyType } from '../../types/policy-type.types';

export interface OrganizationControlsPolicySummary extends BasePolicySummary {
    type: PolicyType.OrganizationControls;

    /**
     * Indicates whether MFA should be enabled for the organization. If set to true, this overrides any individual user's setting for MFA.
     * Once enabled, this cannot be disabled.
     */
    mfaEnabled: boolean;
 }