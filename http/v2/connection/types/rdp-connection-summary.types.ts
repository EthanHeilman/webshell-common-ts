import { BaseConnectionSummary } from '../types/base-connection-summary.types';

export interface RDPConnectionSummary extends BaseConnectionSummary {
    remoteHost: string;
    remotePort: number;
    targetName: string;
}