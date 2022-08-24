import { BaseConnectionSummary } from '../types/base-connection-summary.types';

export interface ShellConnectionSummary extends BaseConnectionSummary {
     spaceId : string;
     targetUser : string;
     sessionRecordingAvailable : boolean;
     sessionRecording : boolean;
     inputRecording : boolean;
 }