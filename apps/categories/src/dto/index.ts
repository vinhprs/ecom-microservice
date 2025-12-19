import { PaginationParamsDto } from '@app/common';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CategoryCondDto extends PaginationParamsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class CategoryCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class CategoryUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

export class CategoryOutputDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  parentId?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt?: Date;
}
