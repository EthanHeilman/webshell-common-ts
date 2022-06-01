import { TargetUser } from '../../../policy/types/target-user.types';
import { Verb } from '../../../policy/types/verb.types';
import { DynamicAccessConfigStatus } from './dynamic-access-config-status.types';

export interface DynamicAccessConfigSummary {
    id: string;
    name: string;
    environmentId: string;
    startWebhook: string;
    stopWebhook: string;
    healthWebhook: string;
    allowedTargetUsers: TargetUser[];
    allowedVerbs: Verb[];
    status: DynamicAccessConfigStatus;
}