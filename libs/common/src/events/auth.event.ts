import { AppEvent } from '.';
import { RABBITMQ_USERS_ROUTING_KEYS } from '..';

export interface AuthEventPayload {
  userId: string;
  email: string;
  fullName?: string;
}

export class AuthEvent<
  T extends AuthEventPayload,
> extends AppEvent<AuthEventPayload> {
  protected constructor(
    eventName: string,
    payload: T,
    options: { id?: string; timestamp?: Date; senderId?: string },
  ) {
    super(eventName, payload, options);
  }

  protected static createEvent<T extends AuthEventPayload>(
    eventName: string,
    payload: T,
    senderId: string,
  ): AuthEvent<T> {
    return new AuthEvent(eventName, payload, { senderId });
  }

  protected static fromJson<T extends AuthEventPayload>(
    json: any,
  ): AuthEvent<T> {
    const { eventName, payload, id, timestamp, senderId } = json;
    return new AuthEvent(eventName, payload, {
      id,
      timestamp,
      senderId,
    });
  }
}

export class AuthUserRegisterEvent extends AuthEvent<AuthEventPayload> {
  static create(
    payload: AuthEventPayload,
    senderId: string,
  ): AuthUserRegisterEvent {
    return AuthEvent.createEvent(
      RABBITMQ_USERS_ROUTING_KEYS.REGISTERED,
      payload,
      senderId,
    ) as AuthUserRegisterEvent;
  }

  static from(json: any): AuthUserRegisterEvent {
    return AuthEvent.fromJson<AuthEventPayload>(json) as AuthUserRegisterEvent;
  }
}
