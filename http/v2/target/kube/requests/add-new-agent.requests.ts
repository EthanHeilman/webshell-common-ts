export interface AddNewAgentRequest {
    name: string;
    environmentId?: string;
    /**
     * i.e. {org: bastionzero, env: prod, labelKey: labelValue}
     */
    labels?: { [key: string]: string; };
    namespace?: string;
}