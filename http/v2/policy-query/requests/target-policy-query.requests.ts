import { TargetUser } from 'http/v2/policy/types/target-user.types';
import { Verb } from 'http/v2/policy/types/verb.types';
import { TargetType } from 'http/v2/target/types/target.types';

export interface TargetPolicyQueryRequest
{
    targetId: string;
    targetType: TargetType;
    verb?: Verb;
    targetUser?: TargetUser;
}