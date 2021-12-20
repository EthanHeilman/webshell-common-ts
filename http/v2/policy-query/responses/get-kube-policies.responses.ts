import { KubeTunnelPolicySummary } from '../../policy/kubernetes-tunnel/types/kube-tunnel-policy-summary.types';

export interface GetKubePoliciesResponse {
    kubeTunnelPolicies: KubeTunnelPolicySummary[]
}