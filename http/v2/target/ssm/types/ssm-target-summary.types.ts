import { TargetStatus } from './target-status.types';

export interface SsmTargetSummary {
     id: string;
     agentId: string;
     agentVersion: string;
     name: string;
     status: TargetStatus;
     environmentId: string;
     timeLastStatusUpdate: Date;
     region: string;
 }