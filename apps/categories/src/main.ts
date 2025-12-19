import { NestFactory } from '@nestjs/core';
import { CategoriesModule } from './categories.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(CategoriesModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');

  await app.listen(configService.get('PORT') ?? 3006);
}
bootstrap();
