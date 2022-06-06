import { TargetType } from '../../target/types/target.types';

export interface CreateUniversalConnectionRequest {
    targetName?: string;
    targetId?: string;
    targetUser?: string;
    targetGroups?: string[];
    targetType?: TargetType;
}