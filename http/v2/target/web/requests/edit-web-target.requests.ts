import { OptionalPort, RequiredPort } from '../../types/port.types';

export interface EditWebTargetRequest {
    /**
     * Name of the target.
     */
    targetName?: string;
    /**
     * Identifier for the backing proxy target.
     */
    proxyTargetId?: string;
    /**
     * Hostname or IP address for the target. This must start with the scheme (http:// or https://).
     */
    remoteHost?: string;
    /**
     * Port to use on the target.
     */
    remotePort?: RequiredPort;
    /**
     * Local hostname or IP address to use on zli for this connection.
     */
    localHost?: string;
    /**
     * Local port to use on zli for this connection.
     */
    localPort?: OptionalPort;
    /**
     * Must specify either environmentId or environmentName.
     */
    environmentId?: string;
}
