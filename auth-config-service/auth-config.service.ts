export interface AuthConfigService {
    getServiceUrl: () => string;
    getSessionId: () => string;
    getSessionIdCookieName: () => string;
    getSessionToken: () => string;
    getSessionTokenCookieName: () => string;
    getIdToken: () => Promise<string>;
}