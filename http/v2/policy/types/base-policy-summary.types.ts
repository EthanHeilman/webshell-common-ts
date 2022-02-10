import { Group } from './group.types';
import { PolicyType } from './policy-type.types';
import { Subject } from './subject.types';

export interface BasePolicySummary {
    /**
     * Type of policy.
     */
    type: PolicyType;
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
}