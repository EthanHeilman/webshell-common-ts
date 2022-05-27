import { Policy } from '../../types/policy.types';
import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';

export interface JustInTimePolicyUpdateRequest {
     /**
      * Policy name. Must be unique.
      */
     name?: string;
     /**
      * Users and API Keys that this policy applies to. Can be an empty array.
      * API Keys are valid for only these policy types: Target Connect.
      */
     subjects?: Subject[];
     /**
      * Groups that this policy applies to. Can be an empty array.
      */
     groups?: Group[];
     /**
      * Any information that will help you understand this policy.
      */
     description?: string;
     /**
      * Policies this policy applies to.
      */
     childPolicies?: Policy[];
     /**
      * Flag that determines whether the creation of the policies will be automatically approved or based on request and approval from reviewers.
      */
     automaticallyApproved?: boolean;
 }