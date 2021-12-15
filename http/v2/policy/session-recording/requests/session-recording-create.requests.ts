import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';

export interface SessionRecordingPolicyCreateRequest {
     /**
      * Policy name. Must be unique.
      */
     name: string;
     /**
      * Users and API Keys that this policy applies to. Can be an empty array.                API Keys are valid for only these policy types: Target Connect.
      */
     subjects: Subject[];
     /**
      * Groups that this policy applies to. Can be an empty array.
      */
     groups: Group[];
     /**
      * Any information that will help you understand this policy.
      */
     description?: string;
     /**
      * Indicates whether the session input should be recorded.                Defaults to <code>false</code>.
      */
     recordInput?: boolean;
 }