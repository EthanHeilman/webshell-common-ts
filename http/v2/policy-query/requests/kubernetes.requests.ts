export interface KubernetesRequest {
    clusterId: string;
    targetUser: string;
    targetGroups: string[];
}