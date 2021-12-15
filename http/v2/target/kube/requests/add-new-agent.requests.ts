export interface AddNewAgentRequest {
    clusterName: string;
    environmentId?: string;
    /**
     * i.e. {org: bastionzero, env: prod, labelKey: labelValue}
     */
    labels?: { [key: string]: string; };
    namespace?: string;
}