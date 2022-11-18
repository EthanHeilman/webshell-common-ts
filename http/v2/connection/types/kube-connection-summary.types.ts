import { BaseConnectionSummary } from '../types/base-connection-summary.types';

export interface KubeConnectionSummary extends BaseConnectionSummary {
    targetUser: string;
    targetGroups: string[];
    targetName: string;
}