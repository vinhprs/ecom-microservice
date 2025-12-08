import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  addressType: string; // 'shipping', 'billing'

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
