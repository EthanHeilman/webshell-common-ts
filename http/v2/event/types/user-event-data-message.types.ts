import { SubjectType } from '../../common.types/subject.types';

export interface UserEventDataMessage {
    id: string;
    organizationId: string;
    subjectId: string;
    subjectType: SubjectType;
    subjectName: string;
    isAdmin: boolean;
    serviceAction: string;
    resource: string;
    evaluation: boolean;
    timestamp: Date;
    ipAddress: string;
    context: string;
 }