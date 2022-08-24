import { BaseConnectionSummary } from '../types/base-connection-summary.types';

export interface DbConnectionSummary extends BaseConnectionSummary {
    remoteHost: string;
    remotePort: number;
    targetName: string;
}