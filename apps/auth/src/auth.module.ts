import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@app/common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/apps/auth/.env',
    }),
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
