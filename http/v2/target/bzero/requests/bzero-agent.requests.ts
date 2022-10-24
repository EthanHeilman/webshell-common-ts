
interface GenericBzeroAgentRequest {
    /**
     * Name of the target.
     */
    targetName?: string;
    /**
     * ID of the target.
     */
    targetId?: string;
    /**
     * Name of the environment.
     */
    envName?: string;
    /**
     * ID of the environment.
     */
    envId?: string;
}

export interface RestartBzeroAgentTargetRequest extends GenericBzeroAgentRequest{
}

export interface RetrieveAgentLogsRequest extends GenericBzeroAgentRequest{
    /**
     * ID of the upload log request.
     */
    uploadLogsRequestId: string;
}

