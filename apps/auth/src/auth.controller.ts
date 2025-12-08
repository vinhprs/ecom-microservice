import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AUTH_SERVICE } from '../auth.di-token';
import { IAuthService } from './interface/auth.interface';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
  ) {}

  @Get()
  getHello(): string {
    return 'Auth Service is running';
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
