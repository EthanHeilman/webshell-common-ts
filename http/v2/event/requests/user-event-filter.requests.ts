import { SubjectType } from '../../common.types/subject.types';

export interface UserEventFilterRequest {
     subjectIds?: string[];
     subjectTypes?: SubjectType[];
     userNames?: string[];
     isAdmin?: boolean;
     ipAddresses?: string[];
     startTimestamp?: Date;
     endTimestamp?: Date;
     eventCount?: number;
     serviceActions?: string[];
     resources?: string[];
     evaluation?: boolean;
 }