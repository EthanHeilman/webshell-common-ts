import { TargetStatus } from '../../types/targetStatus.types';

export interface SsmTargetSummary {
    id: string;
    agentId: string;
    agentPublicKey: string
    agentVersion: string;
    name: string;
    status: TargetStatus;
    environmentId: string;
    timeLastStatusUpdate: Date;
    region: string;
 }