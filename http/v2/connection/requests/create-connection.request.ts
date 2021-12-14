import { ConnectionType } from '../types/connection.types';

export interface CreateConnectionRequest {
     spaceId: string;
     targetId: string;
     connectionType: ConnectionType;
     /**
      * The operating system user that will be used to connect as
      */
     targetUser: string;
 }