import { SubjectType } from '../../common.types/subject.types';

export interface SubjectSummary {
    id: string;
    organizationId: string;
    email: string;
    isAdmin: boolean;
    timeCreated: Date;
    /**
     * If null, to obtain the most recent value GET the user using their Guid
     */
    lastLogin: Date;
    type: SubjectType;
}