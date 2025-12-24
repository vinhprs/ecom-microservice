import {
  GRPC_PACKAGES,
  GRPC_URLS,
  PROTO_FILES,
  getProtoPath,
} from '@app/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { CategoriesModule } from './categories.module';

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

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: GRPC_PACKAGES.CATEGORY,
      protoPath: getProtoPath(PROTO_FILES.CATEGORY),
      url: GRPC_URLS.CATEGORY,
      maxReceiveMessageLength: 1024 * 1024 * 10,
      maxSendMessageLength: 1024 * 1024 * 10,
    },
  });

  await app.startAllMicroservices();

  await app.listen(configService.get('PORT') ?? 3006);
}
bootstrap();
