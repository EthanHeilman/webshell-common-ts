import { TargetBase } from '../../types/targetBase.types';

export interface DbTargetSummary extends TargetBase {
    lastAgentUpdate: Date;
    localPort: number;
    localHost: string;
    remotePort: number;
    remoteHost: string;
    bzeroAgentId: string;
}