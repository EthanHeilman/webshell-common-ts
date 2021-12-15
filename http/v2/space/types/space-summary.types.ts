import { ConnectionSummary } from '../../connection/types/connection-summary.types';
import { SessionState } from './session-state.types';

export interface SpaceSummary {
     id: string;
     displayName: string;
     timeCreated: Date;
     state: SessionState;
     connections: ConnectionSummary[];
     terminalPreferences: string;
 }