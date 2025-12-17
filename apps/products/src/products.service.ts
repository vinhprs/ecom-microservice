import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTS_REPOSITORY } from './products.di-token';
import {
  IProductsRepository,
  IProductsService,
} from './interfaces/products.interface';
import { ProductCondDto, ProductCreateDto, ProductUpdateDto } from './dto';

@Injectable()
export class ProductsService implements IProductsService {
  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  async create(dto: ProductCreateDto) {
    return this.productsRepository.create(dto);
  }

  async findById(id: string) {
    return this.productsRepository.findById(id);
  }

  async findByCond(cond: ProductCondDto) {
    return this.productsRepository.findByCond(cond);
  }

  async update(id: string, updateDto: ProductUpdateDto) {
    return this.productsRepository.update(id, updateDto);
  }
}
