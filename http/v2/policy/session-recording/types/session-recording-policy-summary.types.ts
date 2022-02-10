import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { PolicyType } from '../../types/policy-type.types';

export interface SessionRecordingPolicySummary extends BasePolicySummary {
    type: PolicyType.SessionRecording;

    /**
     * Indicates whether the session input should be recorded.
     */
    recordInput: boolean;
 }