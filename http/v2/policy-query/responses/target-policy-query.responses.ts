import { TargetUser } from 'http/v2/policy/types/target-user.types';
import { Verb } from 'http/v2/policy/types/verb.types';

export interface TargetPolicyQueryResponse
{
    allowed: boolean;
    allowedTargetUsers: TargetUser[];
    allowedVerbs: Verb[]
}