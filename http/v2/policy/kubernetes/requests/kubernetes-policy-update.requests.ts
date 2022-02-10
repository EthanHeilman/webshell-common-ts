import { ClusterGroup } from '../../types/cluster-group.types';
import { ClusterUser } from '../../types/cluster-user.types';
import { Cluster } from '../../types/cluster.types';
import { Environment } from '../../types/environment.types';
import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';

export interface KubernetesPolicyUpdateRequest {
     /**
      * Policy name. Must be unique.
      */
     name?: string;
     /**
      * Users and API Keys that this policy applies to.    API Keys are valid for only these policy types: Target Connect.
      */
     subjects?: Subject[];
     /**
      * Groups that this policy applies to.
      */
     groups?: Group[];
     /**
      * Description of the policy.
      */
     description?: string;
     /**
      * Environments this policy applies to.
      */
     environments?: Environment[];
     /**
      * Kubernetes clusters this policy applies to.
      */
     clusters?: Cluster[];
     /**
      * Kubernetes cluster users allowed by this policy.
      */
     clusterUsers?: ClusterUser[];
     /**
      * Kubernetes cluster groups allowed by this policy.
      */
     clusterGroups?: ClusterGroup[];
 }