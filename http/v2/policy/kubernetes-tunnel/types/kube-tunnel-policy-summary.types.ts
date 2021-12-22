import { BasePolicySummary } from '../../types/base-policy-summary.types';
import { ClusterGroup } from '../../types/cluster-group.types';
import { ClusterUser } from '../../types/cluster-user.types';
import { Cluster } from '../../types/cluster.types';
import { Environment } from '../../types/environment.types';
export interface KubeTunnelPolicySummary extends BasePolicySummary {
     type: 'KubernetesTunnel';
     /**
      * Environments this policy applies to.
      */
     environments: Environment[];
     /**
      * Targets this policy applies to.
      */
     clusters: Cluster[];
     /**
      * Cluster users allowed by this policy.
      */
     clusterUsers: ClusterUser[];
     /**
      * Cluster groups allowed by this policy.
      */
     clusterGroups: ClusterGroup[];
 }