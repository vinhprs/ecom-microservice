import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getHello(): string {
    return 'Users Service is running';
  }
}
