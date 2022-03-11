import { TargetUser } from '../../policy/types/target-user.types';

export interface TunnelsResponse {
    guid: string;
    targetName: string;
    targetUsers: TargetUser[];
}