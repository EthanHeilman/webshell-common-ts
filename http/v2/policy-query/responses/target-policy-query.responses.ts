import { TargetUser } from '../../policy/types/target-user.types';
import { Verb } from '../../policy/types/verb.types';


export interface TargetPolicyQueryResponse
{
    allowed: boolean;
    allowedTargetUsers: TargetUser[];
    allowedVerbs: Verb[]
}

export interface TargetPolicyQueryBatchResponse
{
    responses: TargetPolicyQueryResponse[]
}