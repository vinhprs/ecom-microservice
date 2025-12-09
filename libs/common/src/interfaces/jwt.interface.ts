export interface JwtPayload {
  sub: string;
  email: string;
  iss: string;
  iat: number;
}

export interface GatewayHeaders {
  'x-kong-jwt-claim-email': string;
  'x-kong-jwt-claim-sub': string;
}

export interface GatewayUserPayload {
  id: string;
  email: string;
}
