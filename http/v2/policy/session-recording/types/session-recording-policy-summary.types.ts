import { Group } from '../../types/group.types';
import { PolicyType } from '../../types/policy-type.types';
import { Subject } from '../../types/subject.types';

export interface SessionRecordingPolicySummary {
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
      * Indicates whether the session input should be recorded.
      */
     recordInput: boolean;
 }