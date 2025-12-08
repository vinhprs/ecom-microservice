import { JwtPayload } from '@app/common';
import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
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

  /**
   * Get my profile
   * PROTECTED by Kong - X-User-Id header added by Kong after JWT validation
   */
  @Get('me')
  async getMyProfile(@JwtPayload('sub') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID not found in headers');
    }
    return this.usersService.getProfile(userId);
  }

  /**
   * Update my profile
   * PROTECTED by Kong
   */
  @Put('me')
  async updateMyProfile(
    @JwtPayload('sub') userId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID not found in headers');
    }
    return this.usersService.updateProfile(userId, dto);
  }
}
