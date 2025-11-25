import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule);
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api/v1');

  await app.listen(configService.get('PORT') ?? 3002);
}
bootstrap();
