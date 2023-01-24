import { Environment } from '../../types/environment.types';
import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';
import { TargetUser } from '../../types/target-user.types';
import { Target } from '../../types/target.types';

export interface ProxyPolicyCreateRequest {
    /**
     * Policy name. Must be unique.
     */
    name: string;
    /**
     * Users and API Keys that this policy applies to. Can be an empty array.
     * API Keys are valid for only these policy types: Target Connect.
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
     * Environments this policy applies to.
     * A value must be provided for either <code>environments</code> or <code>targets</code>.
     */
    environments?: Environment[];
    /**
     * Targets this policy applies to.
     * A value must be provided for either <code>targets</code> or <code>environments</code>.
     */
    targets?: Target[];
    /**
     * Users allowed access on the target. NOTE: only applies to passwordless database targets.
     */
    targetUsers?: TargetUser[];
}