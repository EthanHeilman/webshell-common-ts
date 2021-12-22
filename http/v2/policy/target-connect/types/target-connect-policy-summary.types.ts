import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { Environment } from '../../types/environment.types';
import { TargetUser } from '../../types/target-user.types';
import { Target } from '../../types/target.types';
import { Verb } from '../../types/verb.types';

export interface TargetConnectPolicySummary extends BasePolicySummary {
     type: 'TargetConnect'
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
     /**
      * Verbs allowed by this policy.
      */
     verbs: Verb[];
 }