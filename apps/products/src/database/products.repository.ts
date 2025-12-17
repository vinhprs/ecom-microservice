import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProductsRepository } from '../interfaces/products.interface';
import { PrismaService } from './prisma.service';
import {
  ProductCondDto,
  ProductCreateDto,
  ProductOutputDto,
  ProductUpdateDto,
} from '../dto';
import { Product } from '@prisma/products-client';
import { PrismaClient } from '@prisma/products-client';
import { v7 as uuidv7 } from 'uuid';
import { BasePaginationResponse } from '@app/common';
import { plainToInstance } from 'class-transformer';
import { PRODUCTS_PRISMA_SERVICE } from '../products.di-token';

@Injectable()
export class ProductsRepository implements IProductsRepository {
  private prisma: PrismaClient;
  constructor(
    @Inject(PRODUCTS_PRISMA_SERVICE)
    private readonly prismaService: PrismaService,
  ) {
    this.prisma = this.prismaService.instance;
  }

  async create(dto: ProductCreateDto): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        id: uuidv7(),
        ...dto,
      },
    });

    return product;
  }

  async findById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByCond(
    cond: ProductCondDto,
  ): Promise<BasePaginationResponse<ProductOutputDto>> {
    const { page, limit } = cond;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: cond,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: cond }),
    ]);

    const productsOutput = plainToInstance(ProductOutputDto, products);

    return {
      data: productsOutput,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: ProductUpdateDto): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    return product;
  }
}
