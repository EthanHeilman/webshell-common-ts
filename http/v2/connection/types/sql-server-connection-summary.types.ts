import { BaseConnectionSummary } from '../types/base-connection-summary.types';

export interface SQLServerConnectionSummary extends BaseConnectionSummary {
    remoteHost: string;
    remotePort: number;
    targetName: string;
}