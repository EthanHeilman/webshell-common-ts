import { SlackSDKTeam } from "../types/SlackSDKTeam";

export interface SlackSDKIntegrationResponse{
    ok: boolean;
    scope: string;
    access_token: string;
    bot_user_id: string;
    team: SlackSDKTeam
}