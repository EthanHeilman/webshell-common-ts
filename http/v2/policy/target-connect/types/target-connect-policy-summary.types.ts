import { Environment } from '../../types/environment.types';
import { Group } from '../../types/group.types';
import { PolicyType } from '../../types/policy-type.types';
import { Subject } from '../../types/subject.types';
import { TargetUser } from '../../types/target-user.types';
import { Target } from '../../types/target.types';
import { Verb } from '../../types/verb.types';

export interface TargetConnectPolicySummary {
     /**
      * Unique identifier for this policy.
      */
     id: string;
     /**
      * Name of policy.
      */
     name: string;
     /**
      * Description of policy.
      */
     description: string;
     /**
      * Users and API Keys that this policy applies to.
      */
     subjects: Subject[];
     /**
      * Groups that this policy applies to.
      */
     groups: Group[];
     type: PolicyType;
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