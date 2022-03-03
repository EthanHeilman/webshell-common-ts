import { TargetUser } from '../../../policy/types/target-user.types';
import { Verb } from '../../../policy/types/verb.types';

export interface DynamicAccessConfigSummary {
    id: string;
    name: string;
    environmentId: string;
    startWebhook: string;
    stopWebhook: string;
    healthWebhook: string;
    allowedTargetUsers: TargetUser[];
    allowedVerbs: Verb[];
}