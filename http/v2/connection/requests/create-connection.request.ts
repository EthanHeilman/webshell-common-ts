import { TargetType } from '../../target/types/target.types';

export interface CreateShellConnectionRequest {
    spaceId: string;
    targetId: string;
    targetType: TargetType;
    /**
     * The operating system user that will be used to connect as
     */
    targetUser: string;
}