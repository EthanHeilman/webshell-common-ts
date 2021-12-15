import { ClusterGroup } from '../../types/cluster-group.types';
import { ClusterUser } from '../../types/cluster-user.types';
import { Cluster } from '../../types/cluster.types';
import { Environment } from '../../types/environment.types';
import { Group } from '../../types/group.types';
import { PolicyType } from '../../types/policy-type.types';
import { Subject } from '../../types/subject.types';

export interface KubeTunnelPolicySummary {
     /**
      * Unique identifier for this policy.
      */
     id: string;
     /**
      * Name of policy.
      */
     name: string;
     /**
      * Description of policy.
      */
     description: string;
     /**
      * Users and API Keys that this policy applies to.
      */
     subjects: Subject[];
     /**
      * Groups that this policy applies to.
      */
     groups: Group[];
     type: PolicyType;
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