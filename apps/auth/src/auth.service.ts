import { compareHash, hashing } from '@app/common';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { AUTH_REPOSITORY } from '../auth.di-token';
import {
  AuthOutputDto,
  AuthUserOutputDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  TokenOuputDto,
} from './dto';
import { IAuthRepository, IAuthService } from './interface/auth.interface';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthOutputDto> {
    const { email, password, fullName } = registerDto;
    const exist = await this.authRepository.findByCond({ email });

    if (exist) throw new ConflictException('User already exists');

    const hashedPassword = await hashing(password);
    const user = await this.authRepository.create({
      email,
      password: hashedPassword,
      fullName,
    });

    // RPC
    try {
      const usersServiceUrl = this.configService.get('USERS_SERVICE_URL');
      this.logger.log(
        `Creating user profile in users service: ${usersServiceUrl}`,
      );
      await firstValueFrom(
        this.httpService.post(`${usersServiceUrl}/api/v1/users/profiles`, {
          id: user.id,
          email: user.email,
          fullName: fullName || null,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to create user profile: ${error}`);
      await this.authRepository.deleteOne(user.id);

      throw new InternalServerErrorException(
        'Failed to create user profile. Registration rolled back.',
      );
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const hashToken = await hashing(tokens.refreshToken);
    await this.authRepository.updateOne(user.id, {
      refreshToken: hashToken,
    });

    return {
      user: plainToInstance(AuthUserOutputDto, user, {
        excludeExtraneousValues: true,
      }),
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthOutputDto> {
    const { email, password } = loginDto;

    const user = await this.authRepository.findByCond({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await compareHash(user.password, password);

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    const tokens = await this.generateTokens(user.id, user.email);

    const hashToken = await hashing(tokens.refreshToken);
    await this.authRepository.updateOne(user.id, {
      refreshToken: hashToken,
    });

    return {
      user: plainToInstance(AuthUserOutputDto, user, {
        excludeExtraneousValues: true,
      }),
      tokens,
    };
  }

  async refreshToken(refreshToken: RefreshTokenDto): Promise<TokenOuputDto> {
    const token = refreshToken.refreshToken;
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    const user = await this.authRepository.findById(payload.sub);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Invalid refresh token');

    const isRefreshTokenValid = await compareHash(token, user.refreshToken);

    if (!isRefreshTokenValid)
      throw new UnauthorizedException('Invalid refresh token');

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);

    const hashToken = await hashing(tokens.refreshToken);
    await this.authRepository.updateOne(user.id, {
      refreshToken: hashToken,
    });

    return plainToInstance(TokenOuputDto, tokens, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId: string, email: string): Promise<TokenOuputDto> {
    const payload = {
      sub: userId, // User ID (will become X-User-Id)
      email: email, // Email (will become X-User-Email)
      iss: 'ecommerce-auth-service',
      iat: Math.floor(Date.now() / 1000),
      // exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
        algorithm: 'HS256',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        algorithm: 'HS256',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
