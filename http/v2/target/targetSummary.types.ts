import { TargetType } from './types/target.types';
import { TargetBase } from './types/targetBase.types';


export interface TargetSummary extends TargetBase
{
    agentVersion: string;
    targetUsers: string[];
    type: TargetType;
}