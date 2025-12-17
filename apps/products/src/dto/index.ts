import { PaginationParamsDto } from '@app/common';
import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProductCondDto extends PaginationParamsDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export class ProductCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  inventory: number;

  @IsBoolean()
  @IsOptional()
  isFlashSale: boolean;

  @IsNumber()
  @IsOptional()
  flashSalePrice: number;

  @IsDate()
  @IsOptional()
  flashSaleStart: Date;

  @IsDate()
  @IsOptional()
  flashSaleEnd: Date;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class ProductUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ProductOutputDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Transform(({ value }) => (value?.toNumber ? value.toNumber() : value))
  @Expose()
  price: number;

  @Expose()
  inventory: number;

  @Expose()
  isFlashSale: boolean;

  @Transform(({ value }) => (value?.toNumber ? value.toNumber() : value))
  @Expose()
  flashSalePrice?: number;

  @Expose()
  flashSaleStart?: Date;

  @Expose()
  flashSaleEnd?: Date;
}
