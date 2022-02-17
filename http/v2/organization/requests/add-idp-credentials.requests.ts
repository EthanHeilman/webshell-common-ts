export interface AddIdPCredentialsRequest {
  customerId: string;
  adminEmail: string;
  accessToken: string;
  accessTokenLifespan: number;
  refreshToken: string;
  userReadonlyScope?: boolean;
  groupReadonlyScope?: boolean;
}
