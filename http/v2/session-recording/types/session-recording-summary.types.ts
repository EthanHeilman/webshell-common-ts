import { TargetType } from 'http/v2/target/types/target.types';
import { ConnectionState } from '../../connection/types/connection-state.types';

export interface SessionRecordingSummary {
     connectionId: string;
     timeCreated: Date;
     connectionState: ConnectionState;
     targetId: string;
     targetType: TargetType;
     targetUser: string;
     inputRecorded: boolean;
     subjectId: string;
     /**
      * Size of the session recording in bytes
      */
     size: number;
 }