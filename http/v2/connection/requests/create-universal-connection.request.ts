import { VerbType } from '../../policy/types/verb-type.types';
import { TargetType } from '../../target/types/target.types';

export interface CreateUniversalConnectionRequest {
    targetName?: string;
    targetId?: string;
    targetUser?: string;
    envId?: string;
    envName?: string;
    targetGroups?: string[];
    targetType?: TargetType;
    verbType?: VerbType;
}