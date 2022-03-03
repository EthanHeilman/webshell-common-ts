import { TargetUser } from '../../policy/types/target-user.types';
import { Verb } from '../../policy/types/verb.types';

export interface TargetConnectPolicyQueryResponse
{
    allowed: boolean;
    allowedPolicies: string[];
    allowedTargetUsers: TargetUser[];
    allowedVerbs: Verb[];
}