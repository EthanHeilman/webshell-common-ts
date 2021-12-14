import { ConnectionState } from '../../connection/types/connection-state.types';
import { ConnectionType } from '../../connection/types/connection.types';

export interface SessionRecordingSummary { 
     connectionId: string;
     timeCreated: Date;
     connectionState: ConnectionState;
     targetId: string;
     targetType: ConnectionType;
     targetUser: string;
     inputRecorded: boolean;
     subjectId: string;
     /**
      * Size of the session recording in bytes
      */
     size: number;
 }