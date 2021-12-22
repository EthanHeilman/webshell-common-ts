export enum PolicyTypeEnum {
     TargetConnect = 'TargetConnect',
     OrganizationControls = 'OrganizationControls',
     SessionRecording = 'SessionRecording',
     KubernetesTunnel = 'KubernetesTunnel'
 };

export type PolicyType = `${PolicyTypeEnum}`;