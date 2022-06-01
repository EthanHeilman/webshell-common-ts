import { ShellConnectionSummary } from '../../connection/types/shell-connection-summary.types';
import { SpaceState } from './space-state.types';

export interface SpaceSummary {
     id: string;
     displayName: string;
     timeCreated: Date;
     state: SpaceState;
     connections: ShellConnectionSummary[];
     terminalPreferences: string;
 }