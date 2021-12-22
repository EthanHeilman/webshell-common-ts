import { BasePolicySummary } from '../../types/base-policy-summary.types';

export interface SessionRecordingPolicySummary extends BasePolicySummary {
     type: 'SessionRecording';
     /**
      * Indicates whether the session input should be recorded.
      */
     recordInput: boolean;
 }