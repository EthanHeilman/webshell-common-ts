import { ConnectionType } from '../../connection/types/connection.types';

export interface ConnectionsToOpen {
     targetId: string;
     connectionType: ConnectionType;
     targetUser: string;
 }