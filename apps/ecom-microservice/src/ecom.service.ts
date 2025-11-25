import { Injectable } from '@nestjs/common';

@Injectable()
export class EcomService {
  getHello(): string {
    return 'Hello World!';
  }
}
