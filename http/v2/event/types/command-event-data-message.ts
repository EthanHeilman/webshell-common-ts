import { SubjectType } from '../../common.types/subject.types';

export interface CommandEventDataMessage {
     id: string;
     connectionId: string;
     targetId: string;
     targetType: string;
     targetName: string;
     subjectId: string;
     subjectType: SubjectType;
     userName: string;
     organizationId: string;
     timestamp: Date;
     targetUser: string;
     command: string;
 }