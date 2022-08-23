import { TargetUser } from '../../policy/types/target-user.types';

export interface SshTargetsResponse {
    guid: string;
    targetName: string;
    targetUsers: TargetUser[];
    environmentName?: string;
}