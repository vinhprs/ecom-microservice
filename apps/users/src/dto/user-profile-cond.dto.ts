import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UserProfileCondDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
