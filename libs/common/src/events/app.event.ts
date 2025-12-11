import { v7 } from 'uuid';

export abstract class AppEvent<T> {
  private _id: string;
  private _timestamp: Date;
  private _senderId: string;

  constructor(
    private readonly _eventName: string,
    private readonly _payload: T,
    dtoProps?: {
      id?: string;
      timestamp?: Date;
      senderId?: string;
    },
  ) {
    this._id = dtoProps?.id || v7();
    this._timestamp = dtoProps?.timestamp || new Date();
    this._senderId = dtoProps?.senderId || '';
  }

  get id(): string {
    return this._id;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get senderId(): string {
    return this._senderId;
  }

  get eventName(): string {
    return this._eventName;
  }

  get payload(): T {
    return this._payload;
  }

  plainObject() {
    return {
      id: this._id,
      timestamp: this._timestamp,
      senderId: this._senderId,
      eventName: this._eventName,
      payload: this._payload,
    };
  }
}
