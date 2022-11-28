import { ConnectionEventType } from './connection-event.types';
import { SubjectType } from '../../common.types/subject.types';

export interface ConnectionEventDataMessage {
     id: string;
     connectionId: string;
     subjectId: string;
     subjectType: SubjectType;
     subjectName: string;
     organizationId: string;
     sessionId: string;
     sessionName: string;
     targetId: string;
     targetType: string;
     targetName: string;
     targetUser: string;
     timestamp: Date;
     environmentId: string;
     environmentName: string;
     connectionEventType: ConnectionEventType;
     reason: string;
 }