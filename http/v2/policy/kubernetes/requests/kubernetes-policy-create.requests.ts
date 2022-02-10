import { ClusterGroup } from '../../types/cluster-group.types';
import { ClusterUser } from '../../types/cluster-user.types';
import { Cluster } from '../../types/cluster.types';
import { Environment } from '../../types/environment.types';
import { Group } from '../../types/group.types';
import { Subject } from '../../types/subject.types';

export interface KubernetesPolicyCreateRequest {
     /**
      * Policy name. Must be unique.
      */
     name: string;
     /**
      * Users and API Keys that this policy applies to. Can be an empty array.
      * API Keys are valid for only these policy types: Target Connect.
      */
     subjects: Subject[];
     /**
      * Groups that this policy applies to. Can be an empty array.
      */
     groups: Group[];
     /**
      * Any information that will help you understand this policy.
      */
     description?: string;
     /**
      * Environments this policy applies to.
      * A value must be provided for either <code>environments</code> or <code>clusters</code>.
      */
     environments?: Environment[];
     /**
      * Clusters this policy applies to.
      * A value must be provided for either <code>clusters</code> or <code>environments</code>.
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