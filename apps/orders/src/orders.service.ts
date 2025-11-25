import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  getHello(): string {
    return 'Orders Service is running';
  }
}
