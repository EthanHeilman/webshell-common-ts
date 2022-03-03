export interface KubernetesPolicyQueryResponse {
    allowed: boolean;
    allowedPolicies: string[];
    allowedClusterUsers: string[];
    allowedClusterGroups: string[];
}