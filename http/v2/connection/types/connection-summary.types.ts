import { TargetType } from 'http/v2/target/types/target.types';
import { ConnectionState } from './connection-state.types';

export interface ConnectionSummary {
     id: string;
     timeCreated : Date;
     spaceId : string;
     state : ConnectionState;
     targetId : string;
     targetType : TargetType;
     targetUser : string;
     sessionRecordingAvailable : boolean;
     sessionRecording : boolean;
     inputRecording : boolean;
     subjectId : string;
 }