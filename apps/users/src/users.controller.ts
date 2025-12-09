import { GatewayUser, GatewayUserPayload } from '@app/common';
import { Body, Controller, Get, Inject, Post, Put } from '@nestjs/common';
import { USERS_SERVICE } from '../users.di-token';
import { CreateUserProfileDto, UpdateUserProfileDto } from './dto';
import { IUsersService } from './interface/users.interface';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: IUsersService,
  ) {}

  @Post('profiles')
  createProfile(@Body() createDto: CreateUserProfileDto) {
    return this.usersService.createProfile(createDto);
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
