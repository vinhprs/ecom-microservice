import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload } from '../interfaces';

export const ReqUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      // Extract JWT token
      const token = authHeader.substring(7); // Remove 'Bearer '

      // Split token into parts
      const parts = token.split('.');

      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid JWT format');
      }

      // Decode payload (Kong already verified the signature!)
      const payloadBase64 = parts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString(
        'utf-8',
      );
      const payload = JSON.parse(payloadJson);

      // Return specific field or entire payload
      return data ? payload[data] : payload;
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to decode JWT token: ${error.message}`,
      );
    }
  },
);
