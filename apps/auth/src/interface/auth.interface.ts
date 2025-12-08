import { User } from '@prisma/client';
import {
  AuthCondDto,
  AuthOutputDto,
  AuthUserUpdateDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  TokenOuputDto,
} from '../dto';

export interface IAuthRepository {
  findById(id: string): Promise<User | null>;
  findByCond(cond: AuthCondDto): Promise<User | null>;
  create(createDto: RegisterDto): Promise<User>;
  updateOne(id: string, updateDto: AuthUserUpdateDto): Promise<User>;
  deleteOne(id: string): Promise<void>;
}

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<AuthOutputDto>;
  login(loginDto: LoginDto): Promise<AuthOutputDto>;
  refreshToken(refreshToken: RefreshTokenDto): Promise<TokenOuputDto>;
  generateTokens(userId: string, email: string): Promise<TokenOuputDto>;
}
