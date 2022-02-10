import { KubernetesPolicySummary } from '../../policy/kubernetes/types/kubernetes-policy-summary.types';

export interface GetKubernetesPoliciesResponse {
    kubernetesPolicies: KubernetesPolicySummary[]
}