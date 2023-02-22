export interface CreateAuthorizedGithubActionRequest {
     /**
      * Unique ID of a Github Action that will be allowed to create expiring policies.
      */
     githubActionId: string;
 }