import { ConnectionSummary } from '../../connection/types/connection-summary.types';
import { SpaceState } from './space-state.types';

export interface SpaceSummary {
     id: string;
     displayName: string;
     timeCreated: Date;
     state: SpaceState;
     connections: ConnectionSummary[];
     terminalPreferences: string;
 }