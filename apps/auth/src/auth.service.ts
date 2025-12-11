import {
  JwtPayload,
  RABBITMQ_EXCHANGES,
  RABBITMQ_USERS_ROUTING_KEYS,
  compareHash,
  hashing,
} from '@app/common';
import { AuthUserRegisterEvent } from '@app/common/events/auth.event';
import { RabbitMQService } from '@app/common/rabbitmq/rabbitmq.service';
import {
  ConflictException,
  Inject,
  Injectable,
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

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersClient: RabbitMQService,
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
      const event = AuthUserRegisterEvent.create(
        {
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
        },
        user.id,
      );

      this.usersClient.publishEvent(
        RABBITMQ_EXCHANGES.USER_EVENTS,
        RABBITMQ_USERS_ROUTING_KEYS.REGISTERED,
        event.plainObject(),
      );
    } catch (error) {
      this.logger.error(`Failed to publish user registration event: ${error}`);
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
    const payload: JwtPayload = {
      sub: userId,
      email: email,
      iss: 'ecommerce-auth-service',
      iat: Math.floor(Date.now() / 1000),
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
