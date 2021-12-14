import { ConnectionState } from './connection-state.types';
 import { ConnectionType } from './connection.types';
 
 export interface ConnectionSummary { 
     id: string;
     timeCreated : Date;
     sessionId : string;
     state : ConnectionState;
     serverId : string;
     serverType : ConnectionType;
     userName : string;
     sessionRecordingAvailable : boolean;
     sessionRecording : boolean;
     inputRecording : boolean;
     subjectId : string;
 }