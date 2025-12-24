import { BasePaginationResponse } from '@app/common';
import {
  ProductCondDto,
  ProductCreateDto,
  ProductOutputDto,
  ProductUpdateDto,
} from '../dto';
import { Product } from 'apps/products/prisma/generated/products-client';

export interface IProductsService {
  create(dto: ProductCreateDto): Promise<ProductOutputDto>;
  findById(id: string): Promise<ProductOutputDto>;
  findByIds(ids: string[]): Promise<ProductOutputDto[]>;
  findByCond(cond: ProductCondDto): Promise<ProductOutputDto>;
  list(cond: ProductCondDto): Promise<BasePaginationResponse<ProductOutputDto>>;
  update(id: string, updateDto: ProductUpdateDto): Promise<ProductOutputDto>;
}

export interface IProductsRepository {
  create(createDto: ProductCreateDto): Promise<Product>;
  findById(id: string): Promise<Product>;
  findByIds(ids: string[]): Promise<Product[]>;
  findByCond(cond: ProductCondDto): Promise<Product>;
  list(cond: ProductCondDto): Promise<BasePaginationResponse<Product>>;
  update(id: string, updateDto: ProductUpdateDto): Promise<Product>;
}
