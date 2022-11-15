import { GenericBzeroAgentRequest } from './generic-agent.requests';

export interface RetrieveAgentLogsRequest extends GenericBzeroAgentRequest{
    /**
     * ID of the upload log request.
     */
    uploadLogsRequestId: string;
}
