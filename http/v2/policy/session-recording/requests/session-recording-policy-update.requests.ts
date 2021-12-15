import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';

export interface SessionRecordingPolicyUpdateRequest {
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
      * Indicates whether the session input should be recorded.                Defaults to <code>false</code>.
      */
     recordInput?: boolean;
 }