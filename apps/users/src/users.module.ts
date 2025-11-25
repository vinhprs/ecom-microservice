import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/apps/users/.env',
    }),
    LoggerModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
