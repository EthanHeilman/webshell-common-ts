export interface EditDbTargetRequest {
    /**
     * Name of the target.
     */
    targetName?: string;
    /**
     * Identifier for the backing bzero agent for this target.
     */
    bzeroAgentId?: string;
    /**
     * Hostname or IP address for the target.
     */
    remoteHost?: string;
    /**
     * Port to use on the target.
     */
    remotePort?: number;
    /**
     * Local hostname or IP address to use on zli for this connection.
     */
    localHost?: string;
    /**
     * Local port to use on zli for this connection.
     */
    localPort?: number;
    /**
     * Must specify either environmentId or environmentName.
     */
    environmentId?: string;
}