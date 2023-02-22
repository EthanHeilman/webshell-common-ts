export interface AuthorizedGithubActionSummary {
    /**
     * Unique identifier for the authorized Github Action.
     */
    id: string;

    /**
     * Unique identifier for the organization the authorized Github Action is associated with.
     */
    organizationId: string;

    /**
     * UTC timestamp indicating when the authorized Github Action was added in BastionZero.
     */
    timeCreated : Date;

    /**
     * Unique identifier for the user who created this authorized Github Action.
     */
    createdBy: string;

    /**
     * Unique Github identifier of the authorized Github Action.
     */
    githubActionId: string;
}