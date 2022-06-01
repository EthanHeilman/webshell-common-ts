
import { ConnectionState } from './connection-state.types';
import { DynamicAccessTargetState } from './dynamic-access-target-state';

export interface DynamicAccessConnectionSummary {
    id: string;
    connectionState: ConnectionState;
    dynamicAccessTargetState: DynamicAccessTargetState;
    provisioningServerUniqueId?: string;
    provisioningServerErrorMessage?: string;
}