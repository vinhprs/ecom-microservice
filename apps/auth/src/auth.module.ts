import { Module, Provider } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@app/common/logger/logger.module';
import { AUTH_REPOSITORY, AUTH_SERVICE } from '../auth.di-token';
import { AuthRepository } from './database/auth.repository';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

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
  ],
  controllers: [AuthController],
  providers,
  exports: providers,
})
export class AuthModule {}
