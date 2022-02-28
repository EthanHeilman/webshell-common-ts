import { TargetStatus } from '../../types/targetStatus.types';

export interface BzeroAgentSummary {
    id: string;
    name: string;
    status: TargetStatus;
    environmentId?: string;
    agentVersion: string;
    lastAgentUpdate: Date;
    region: string;
    agentPublicKey: string;
}