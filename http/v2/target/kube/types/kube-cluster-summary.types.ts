import { TargetBase } from '../../types/targetBase.types';

export interface KubeClusterSummary extends TargetBase {
    id: string;
    environmentId: string;
    validUsers: string[];
    lastAgentUpdate: Date;
 }