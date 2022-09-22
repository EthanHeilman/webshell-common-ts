import { TargetUser } from '../../../policy/types/target-user.types';
import { Verb } from '../../../policy/types/verb.types';
import { TargetStatus } from '../../types/targetStatus.types';
import { ControlChannelSummary } from '../../control-channel-summary.types';

export interface BzeroAgentSummary {
    id: string;
    name: string;
    status: TargetStatus;
    environmentId?: string;
    agentVersion: string;
    lastAgentUpdate: Date;
    region: string;
    agentPublicKey: string;
    allowedTargetUsers: TargetUser[];
    allowedVerbs: Verb[];
    controlChannel: ControlChannelSummary;
}