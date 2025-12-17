import { BasePaginationResponse } from '@app/common';
import {
  ProductCondDto,
  ProductCreateDto,
  ProductOutputDto,
  ProductUpdateDto,
} from '../dto';
import { Product } from '@prisma/products-client';

export interface IProductsService {
  create(dto: ProductCreateDto): Promise<Product>;
  findById(id: string): Promise<Product>;
  findByCond(
    cond: ProductCondDto,
  ): Promise<BasePaginationResponse<ProductOutputDto>>;
  update(id: string, updateDto: ProductUpdateDto): Promise<Product>;
}

export interface IProductsRepository {
  create(createDto: ProductCreateDto): Promise<Product>;
  findById(id: string): Promise<Product>;
  findByCond(
    cond: ProductCondDto,
  ): Promise<BasePaginationResponse<ProductOutputDto>>;
  update(id: string, updateDto: ProductUpdateDto): Promise<Product>;
}
