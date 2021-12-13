export interface NewApiKeyRequest {
    /**
     * Name is optional and will default to the ApiKey's ID
     */
    name?: string;
    /**
     * Indicates if this is a registration key
     */
    isRegistrationKey: boolean;
}