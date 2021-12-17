import { TargetUser } from "../../policy/types/target-user.types";
import { Verb } from "../../policy/types/verb.types";
import { TargetType } from "../../target/types/target.types";

export interface TargetPolicyQueryRequest
{
    targetId: string;
    targetType: TargetType;
    verb?: Verb;
    targetUser?: TargetUser;
}