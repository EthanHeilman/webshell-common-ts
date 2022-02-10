import { Environment } from '../../types/environment.types';
import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';
import { Target } from '../../types/target.types';

export interface ProxyPolicyUpdateRequest {
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
     * Environments this policy applies to.
     */
    environments?: Environment[];
    /**
     * Targets this policy applies to.
     */
    targets?: Target[];
}