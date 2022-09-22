import { TargetBase } from '../../types/targetBase.types';
import { ControlChannelSummary } from '../../control-channel-summary.types';
export interface KubeClusterSummary extends TargetBase {
    id: string;
    environmentId: string;
    lastAgentUpdate: Date;
    allowedClusterUsers: string[];
    allowedClusterGroups: string[];
    controlChannel: ControlChannelSummary;
 }