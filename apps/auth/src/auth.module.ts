import {
  RABBITMQ_EXCHANGES,
  RabbitMQClientModule,
  USERS_SERVICE,
} from '@app/common';
import { LoggerModule } from '@app/common/logger/logger.module';
import { HttpModule } from '@nestjs/axios';
import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_REPOSITORY, AUTH_SERVICE } from '../auth.di-token';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './database/auth.repository';

const providers: Provider[] = [
  {
    provide: AUTH_REPOSITORY,
    useClass: AuthRepository,
  },
  {
    provide: AUTH_SERVICE,
    useClass: AuthService,
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/apps/auth/.env',
    }),
    LoggerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
    }),
    HttpModule,
    RabbitMQClientModule.register([
      {
        name: USERS_SERVICE,
        exchange: RABBITMQ_EXCHANGES.USER_EVENTS,
      },
    ]),
  ],
  controllers: [AuthController],
  providers,
  exports: providers,
})
export class AuthModule {}
