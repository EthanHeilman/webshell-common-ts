import { TargetType } from 'http/v2/target/types/target.types';
import { SubjectType } from '../../common.types/subject.types';

export interface CommandEventFilterRequest {
     subjectIds?: string[];
     subjectTypes?: SubjectType;
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
     targetTypes?: TargetType[];
     targetUsers?: string[];
     commandSearch?: string;
 }