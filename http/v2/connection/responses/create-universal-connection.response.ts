import { TargetType } from '../../target/types/target.types';
import { ShellConnectionAuthDetails } from '../types/shell-connection-auth-details.types';

export interface CreateUniversalConnectionResponse {
    connectionId: string;
    targetId: string;
    targetName: string;
    targetType: TargetType;
    targetUser: string;
    agentPublicKey: string;
    agentVersion: string;
    connectionAuthDetails: ShellConnectionAuthDetails;
    sshScpOnly?: boolean;
}