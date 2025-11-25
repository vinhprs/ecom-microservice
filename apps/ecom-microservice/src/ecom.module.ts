import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EcomController } from './ecom.controller';
import { EcomService } from './ecom.service';
import { LoggerModule } from '@app/common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/apps/ecom-microservice/.env',
    }),
    LoggerModule,
  ],
  controllers: [EcomController],
  providers: [EcomService],
})
export class EcomModule {}
