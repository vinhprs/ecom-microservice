import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  MinLength,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @IsString()
  @IsOptional()
  fullName: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthCondDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  password?: string;
}

export class AuthUserUpdateDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class AuthUserOutputDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  fullName: string;

  @Exclude()
  password: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  isActive: boolean;
}

export class TokenOuputDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;
}

export class AuthOutputDto {
  @Expose()
  @Type(() => AuthUserOutputDto)
  user: AuthUserOutputDto;

  @Expose()
  @Type(() => TokenOuputDto)
  tokens: TokenOuputDto;
}
