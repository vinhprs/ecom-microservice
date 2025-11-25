import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { EcomModule } from './ecom.module';

async function bootstrap() {
  const app = await NestFactory.create(EcomModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);

  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();
