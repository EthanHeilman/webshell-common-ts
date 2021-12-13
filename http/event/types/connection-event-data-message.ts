import { ConnectionEventType } from './connection-event.types';
 import { SubjectType } from '../../common.types/subject.types';
 
 export interface ConnectionEventDataMessage { 
     id: string;
     connectionId: string;
     subjectId: string;
     subjectType: SubjectType;
     userName: string;
     organizationId: string;
     sessionId: string;
     sessionName: string;
     targetId: string;
     targetType: string;
     targetName: string;
     targetUser: string;
     timestamp: Date;
     connectionEventType: ConnectionEventType;
     reason: string;
 }