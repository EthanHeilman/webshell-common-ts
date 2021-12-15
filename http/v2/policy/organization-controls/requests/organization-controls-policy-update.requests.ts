import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';

export interface OrganizationControlsPolicyUpdateRequest {
     /**
      * Policy name. Must be unique.
      */
     name?: string;
     /**
      * Users and API Keys that this policy applies to.    API Keys are valid for only these policy types: Target Connect.
      */
     subjects?: Array<Subject>;
     /**
      * Groups that this policy applies to.
      */
     groups?: Array<Group>;
     /**
      * Description of the policy.
      */
     description?: string;
     /**
      * Indicates whether MFA should be enabled for the organization. If set to true, this overrides any individual user's setting for MFA.                Once enabled, this cannot be disabled.
      */
     mfaEnabled?: boolean;
 }