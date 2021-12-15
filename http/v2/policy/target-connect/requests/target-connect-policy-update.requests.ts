import { Environment } from '../../types/environment.types';
import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';
import { TargetUser } from '../../types/target-user.types';
import { Target } from '../../types/target.types';
import { Verb } from '../../types/verb.types';

export interface TargetConnectPolicyUpdateRequest {
     /**
      * Policy name. Must be unique.
      */
     name?: string;
     /**
      * Users and API Keys that this policy applies to.    API Keys are valid for only these policy types: Target Connect.
      */
     subjects?: Subject[];
     /**
      * Groups that this policy applies to.
      */
     groups?: Group[];
     /**
      * Description of the policy.
      */
     description?: string;
     /**
      * Environments this policy applies to.
      */
     environments?: Environment[];
     /**
      * Targets this policy applies to.
      */
     targets?: Target[];
     /**
      * Target users allowed by this policy.
      */
     targetUsers?: TargetUser[];
     /**
      * Verbs allowed by this policy. Defines the actions that are allowed via target connections.
      */
     verbs?: Verb[];
 }