import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(OrdersModule);
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');

  await app.listen(configService.get('PORT') ?? 3004);
}
bootstrap();
