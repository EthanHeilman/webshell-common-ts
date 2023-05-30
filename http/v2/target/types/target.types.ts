import { AgentType } from './agent.types';

// NOTE: while we transition to the new targets/agents paradigm, TargetType is for the user's benefit only.
// We still define TargetTypes in the backend in such a way that Bzero = Linux | Windows
export enum TargetType {
    SsmTarget = 'SsmTarget',
    DynamicAccessConfig = 'DynamicAccessConfig',
    Cluster = 'Cluster', // depcreated as of ZLI 6.21.0
    Kubernetes = 'Kubernetes',
    Linux = 'Linux',
    Windows = 'Windows',
    Bzero = 'Bzero',
    Web = 'Web',
    Db = 'Db'
};

export function toTargetType(agentType: AgentType): TargetType {
    switch (agentType) {
    case AgentType.Cluster:
        return TargetType.Kubernetes;
    case AgentType.Linux:
        return TargetType.Linux;
    case AgentType.Windows:
        return TargetType.Windows;
    }
}