import { Module, Provider } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConfigModule } from '@nestjs/config';
import {
  LoggerModule,
  RabbitMQClientModule,
  RABBITMQ_EXCHANGES,
  USERS_SERVICE as USERS_SERVICE_NAME,
} from '@app/common';
import {
  PRISMA_SERVICE,
  SHARDING_SERVICE,
  USERS_SERVICE,
} from '../users.di-token';
import { PrismaService } from './database/prisma.service';
import { ShardingService } from './database/sharding.service';

const providers: Provider[] = [
  {
    provide: USERS_SERVICE,
    useClass: UsersService,
  },
  { provide: PRISMA_SERVICE, useClass: PrismaService },
  { provide: SHARDING_SERVICE, useClass: ShardingService },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/apps/users/.env',
    }),
    LoggerModule,
    RabbitMQClientModule.register([
      {
        name: USERS_SERVICE_NAME,
        exchange: RABBITMQ_EXCHANGES.USER_EVENTS,
        exchangeType: 'topic',
      },
    ]),
  ],
  controllers: [UsersController],
  providers,
  exports: providers,
})
export class UsersModule {}
