
export interface CreateUniversalSshConnectionRequest {
    targetName?: string;
    targetId?: string;
    targetUser: string;
    remoteHost: string;
    remotePort: number;
}