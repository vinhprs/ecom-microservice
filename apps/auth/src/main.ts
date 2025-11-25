import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api/v1');

  await app.listen(configService.get('PORT') ?? 3001);
}
bootstrap();
