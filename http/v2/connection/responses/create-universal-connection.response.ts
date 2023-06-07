import { AgentType } from '../../target/types/agent.types';
import { TargetType } from '../../target/types/target.types';
import { ConnectionAuthDetails } from '../types/connection-auth-details.types';

export interface CreateUniversalConnectionResponse {
    connectionId: string;
    targetId: string;
    targetName: string;
    agentType: AgentType;
    targetType: TargetType;
    targetUser: string;
    agentPublicKey: string;
    agentVersion: string;
    connectionAuthDetails: ConnectionAuthDetails;
    sshScpOnly?: boolean;
    splitCert?: boolean;
}