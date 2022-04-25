import { SubjectType } from '../../common.types/subject.types';

export interface CommandEventResponse {
    id: string;
    connectionId: string;
    subjectId: string;
    subjectType: SubjectType;
    userName: string;
    organizationId: string;
    targetId: string;
    targetType: string;
    targetName: string;
    targetUser: string;
    timestamp: Date;
    command: string;
}