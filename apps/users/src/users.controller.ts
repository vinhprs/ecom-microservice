import {
  AuthUserRegisterEvent,
  GatewayUser,
  GatewayUserPayload,
  RABBITMQ_EXCHANGES,
  RABBITMQ_USERS_QUEUES,
  RABBITMQ_USERS_ROUTING_KEYS,
} from '@app/common';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Body, Controller, Get, Inject, Logger, Put } from '@nestjs/common';
import { USERS_SERVICE } from '../users.di-token';
import { UpdateUserProfileDto } from './dto';
import { IUsersService } from './interface/users.interface';

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: IUsersService,
  ) {}

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGES.USER_EVENTS,
    routingKey: RABBITMQ_USERS_ROUTING_KEYS.REGISTERED,
    queue: RABBITMQ_USERS_QUEUES.PROFILE,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DLX_USER_EVENTS,
        'x-dead-letter-routing-key': RABBITMQ_USERS_ROUTING_KEYS.PROFILE_FAILED,
      },
    },
  })
  async createProfile(@RabbitPayload() rawPayload: any) {
    try {
      const event = AuthUserRegisterEvent.from(rawPayload);

      const { userId, email, fullName } = event.payload;
      await this.usersService.createProfile({
        id: userId,
        email,
        fullName,
      });

      this.logger.log(`User profile created successfully for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error processing user registration event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('me')
  async getMyProfile(@GatewayUser() user: GatewayUserPayload) {
    return this.usersService.getProfile(user.id);
  }

  @Put('me')
  async updateMyProfile(
    @GatewayUser() user: GatewayUserPayload,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
