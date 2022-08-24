
import { TargetType } from '../../target/types/target.types';
import { ConnectionState } from './connection-state.types';

export interface BaseConnectionSummary {
    id: string;
    timeCreated: Date;
    state: ConnectionState;
    targetId: string;
    targetType: TargetType;
    subjectId: string;
}