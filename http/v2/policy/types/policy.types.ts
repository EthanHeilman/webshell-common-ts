import { PolicyType } from './policy-type.types';

export interface Policy {
    id: string;
    policyType: PolicyType;
    name: string;
}