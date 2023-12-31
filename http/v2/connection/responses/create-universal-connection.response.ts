import { VerbType } from '../../policy/types/verb-type.types';
import { AgentType } from '../../target/types/agent.types';
import { TargetType } from '../../target/types/target.types';
import { ShellConnectionAuthDetails } from '../types/shell-connection-auth-details.types';

export interface CreateUniversalConnectionResponse {
    connectionId: string;
    targetId: string;
    targetName: string;
    agentType: AgentType;
    targetType: TargetType;
    verbType: VerbType;
    targetUser: string;
    agentPublicKey: string;
    agentVersion: string;
    connectionAuthDetails: ShellConnectionAuthDetails;
    sshScpOnly?: boolean;
    splitCert?: boolean;
}