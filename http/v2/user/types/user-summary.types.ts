export interface UserSummary {
    id: string;
    organizationId: string;
    fullName: string;
    email: string;
    isAdmin: boolean;
    timeCreated: Date;
    /**
     * If null, to obtain the most recent value GET the user using their Guid
     */
    lastLogin: Date;
}