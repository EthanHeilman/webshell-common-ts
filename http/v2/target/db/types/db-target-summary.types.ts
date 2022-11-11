import { OptionalPort, RequiredPort } from '../../types/port.types';
import { TargetBase } from '../../types/targetBase.types';
import { TargetRole } from '../../../policy/types/target-role.types';

export interface DbTargetSummary extends TargetBase {
    lastAgentUpdate: Date;
    localPort: OptionalPort;
    localHost: string;
    remotePort: RequiredPort;
    remoteHost: string;
    isPasswordless?: boolean;
    databaseType?: string;
    proxyTargetId: string;
    allowedTargetRoles?: TargetRole[];
}
