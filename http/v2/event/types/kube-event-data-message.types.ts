import { KubeEventData } from './kube-event-data.types';

export interface KubeEventDataMessage {
     id: string;
     creationDate: Date;
     role: string;
     targetGroups: string[];
     endpoints: KubeEventData[];
     execCommands: KubeEventData[];
     kubeEnglishCommand: string;
     statusCode: number;
     userId: string;
     clusterId: string;
     clusterName: string;
     userEmail: string;
 }