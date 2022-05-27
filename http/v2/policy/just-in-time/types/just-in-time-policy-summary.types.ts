import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { Policy } from '../../types/policy.types';
import { PolicyType } from '../../types/policy-type.types';

export interface JustInTimePolicySummary extends BasePolicySummary {
     type: PolicyType.JustInTime;

     /**
      * Policies this policy applies to. Currently only TargetConnect, Kubernetes and Proxy policies can be children of a Just In Time policy.
      */
     childPolicies: Policy[];
     /**
      * Flag that determines whether the creation of the policies will be automatically approved or based on request and approval from reviewers.
      */
     automaticallyApproved: boolean;
 }