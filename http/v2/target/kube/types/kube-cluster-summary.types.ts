import { AgentStatus } from './agent-status.types';

 export interface KubeClusterSummary { 
     id: string;
     clusterName: string;
     status: AgentStatus;
     environmentId: string;
     validUsers: string[];
     lastAgentUpdate: Date;
     agentVersion: string;
 }