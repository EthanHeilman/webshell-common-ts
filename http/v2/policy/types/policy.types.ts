import { PolicyType } from './policy-type.types';

export interface Policy {
    id: string;
    type: PolicyType;
    name: string;
}