import { TargetBase } from '../../types/targetBase.types';

export interface KubeClusterSummary extends TargetBase {
    id: string;
    environmentId: string;
    lastAgentUpdate: Date;
    allowedClusterUsers: string[];
    allowedClusterGroups: string[];
 }