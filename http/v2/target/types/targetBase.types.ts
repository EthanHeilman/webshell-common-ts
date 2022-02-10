import { TargetStatus } from './targetStatus.types';
import { TargetType } from './target.types';

export interface TargetBase
{
    id: string;
    status: TargetStatus;
    name: string;
    environmentId: string;
    type: TargetType;
    agentVersion: string;
    region: string;
}