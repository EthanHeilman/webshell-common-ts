export enum PolicyType {
    TargetConnect = 'TargetConnect',
    OrganizationControls = 'OrganizationControls',
    SessionRecording = 'SessionRecording',
    KubernetesTunnel = 'KubernetesTunnel', // Deprecated in favor of Kubernetes
    Kubernetes = 'Kubernetes',
    Proxy = 'Proxy'
 };