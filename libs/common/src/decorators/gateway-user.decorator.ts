import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import { GatewayHeaders, GatewayUserPayload } from '../interfaces';

export const GatewayUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): GatewayUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { headers: GatewayHeaders }>();

    if (
      !request.headers['x-kong-jwt-claim-sub'] ||
      !request.headers['x-kong-jwt-claim-email']
    ) {
      throw new UnauthorizedException('Unauthorized');
    }
    return {
      id: request.headers['x-kong-jwt-claim-sub'],
      email: request.headers['x-kong-jwt-claim-email'],
    };
  },
);
