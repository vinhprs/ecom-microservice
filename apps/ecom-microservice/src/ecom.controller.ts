import { Controller, Get } from '@nestjs/common';
import { EcomService } from './ecom.service';

@Controller()
export class EcomController {
  constructor(private readonly ecomService: EcomService) {}
  @Get()
  getHello(): string {
    return this.ecomService.getHello();
  }
}
