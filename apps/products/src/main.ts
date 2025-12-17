import { NestFactory } from '@nestjs/core';
import { ProductsModule } from './products.module';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(ProductsModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');

  await app.listen(configService.get('PORT') ?? 3003);
}
bootstrap();
