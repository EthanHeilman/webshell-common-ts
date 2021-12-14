import { MfaActionRequired } from "http/v2/mfa/types/mfa-action-required.types";

export interface UserRegisterResponse
{
    userSessionId: string;
    mfaActionRequired: MfaActionRequired;
}