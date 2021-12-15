import { ConnectionType } from '../../connection/types/connection.types';
import { SubjectType } from '../../common.types/subject.types';
import { ConnectionEventType } from '../types/connection-event.types';

export interface ConnectionEventFilterRequest {
     subjectIds?: string[];
     subjectTypes?: SubjectType[];
     userNames?: string[];
     isAdmin?: boolean;
     ipAddresses?: string[];
     startTimestamp?: Date;
     endTimestamp?: Date;
     eventCount?: number;
     connectionIds?: string[];
     sessionIds?: string[];
     sessionNames?: string[];
     targetIds?: string[];
     targetNames?: string[];
     targetTypes?: ConnectionType[];
     targetUsers?: string[];
     connectionEventTypes?: ConnectionEventType[];
 }