import { TargetStatus } from './targetStatus.types';
import { TargetType } from './target.types';
import { DynamicAccessConfigStatus } from '../dynamic/types/dynamic-access-config-status.types';

export interface TargetBase
{
    id: string;
    agentPublicKey: string;
    status: TargetStatus | DynamicAccessConfigStatus;
    name: string;
    environmentId: string;
    type: TargetType;
    agentVersion: string;
    region: string;
}