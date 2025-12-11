import {
  RabbitMQConfig,
  RabbitMQModule as GolevelupRabbitMQModule,
} from '@golevelup/nestjs-rabbitmq';
import {
  ConfigurableModuleAsyncOptions,
  DynamicModule,
  Module,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';

export interface RabbitmqModuleOptions {
  name: string;
  exchange: string;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  durable?: boolean;
}

@Module({})
export class RabbitMQClientModule {
  public static register(options: RabbitmqModuleOptions[]): DynamicModule {
    const clients: ConfigurableModuleAsyncOptions<RabbitMQConfig>[] =
      options.map(
        ({ name, exchange, exchangeType = 'topic', durable = true }) => ({
          name,
          useFactory: (configService: ConfigService) => ({
            uri: configService.get<string>('RABBITMQ_URL')!,
            exchanges: [
              {
                name: exchange,
                type: exchangeType,
                options: { durable },
              },
            ],
            connectionInitOptions: {
              wait: true,
            },
            enableControllerDiscovery: true,
          }),
          inject: [ConfigService],
        }),
      );

    const rmqDynamicModules = clients.map((client) => {
      return GolevelupRabbitMQModule.forRootAsync(client);
    });

    return {
      module: RabbitMQClientModule,
      imports: [ConfigModule, ...rmqDynamicModules],
      providers: [RabbitMQService],
      exports: [RabbitMQService],
    };
  }
}
