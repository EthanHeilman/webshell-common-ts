import { MfaActionRequired } from '../../mfa/types/mfa-action-required.types';


export interface UserRegisterResponse
{
    userSessionId: string;
    mfaActionRequired: MfaActionRequired;
}