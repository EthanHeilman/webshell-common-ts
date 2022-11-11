import { OptionalPort, RequiredPort } from '../../types/port.types';

export interface AddNewDbTargetRequest {
    /**
     * Name of the target.
     */
    targetName: string;
    /**
     * Identifier for the backing proxy target.
     */
    proxyTargetId: string;
    /**
     * Hostname or IP address for the target.
     */
    remoteHost: string;
    /**
     * Port to use on the target.
     */
    remotePort: RequiredPort;
    /**
     * Local hostname or IP address to use on zli for this connection.
     */
    localHost?: string;
    /**
     * Local port to use on zli for this connection.
     */
    localPort?: OptionalPort;
    /**
     * True if the remote database has been configured to be accessed with an MPC certificate. False otherwise.
     */
    isPasswordless?: boolean;
    /**
     * The type of database running on the target (e.g., Postgres, MongoDB)
     */
    databaseType?: string;
    /**
     * Must specify either environmentId or environmentName.
     */
    environmentId?: string;
    /**
     * Must specify either environmentId or environmentName.
     */
    environmentName?: string;
}
