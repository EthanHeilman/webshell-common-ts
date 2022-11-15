
import { ConnectionState } from '../../connection/types/connection-state.types';
import { TargetType } from '../../target/types/target.types';

export interface SessionRecordingSummary {
     connectionId: string;
     timeCreated: Date;
     connectionState: ConnectionState;
     targetId: string;
     targetType: TargetType;
     targetName: string;
     targetUser: string;
     inputRecorded: boolean;
     subjectId: string;
     /**
      * Size of the session recording in bytes
      */
     size: number;
 }