import { KubeEventData } from '../types/kube-event-data.types';

export interface KubeEventDataResponse {
    id: string;
    creationDate: Date;
    role: string
    targetGroups: string[],
    endpoints: KubeEventData[],
    execCommands: KubeEventData[],
    kubeEnglishCommand: string,
    statusCode: number,
    userId: string,
    clusterId: string,
    targetName: string,
    userEmail: string
}