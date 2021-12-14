import { ConnectionsToOpen } from '../types/connections-to-open.types';

 export interface CreateSpaceRequest { 
     displayName: string;
     connectionsToOpen?: ConnectionsToOpen[];
 }