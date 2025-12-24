import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProductsRepository } from '../interfaces/products.interface';
import { PrismaService } from './prisma.service';
import { ProductCondDto, ProductCreateDto, ProductUpdateDto } from '../dto';
import { Product, Prisma } from '../../prisma/generated/products-client';
import { v7 as uuidv7 } from 'uuid';
import { PRODUCTS_PRISMA_SERVICE } from '../products.di-token';

@Injectable()
export class ProductsRepository implements IProductsRepository {
  private prisma: any;
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

  async findByCond(cond: ProductCondDto): Promise<Product> {
    const { name } = cond;

    const filter: Prisma.ProductWhereInput = {};

    if (name) {
      filter.name = { contains: name };
    }

    const product = await this.prisma.product.findFirst({
      where: filter,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });

    return products;
  }

  async list(cond: ProductCondDto) {
    const { page, limit, name } = cond;

    const filter: Prisma.ProductWhereInput = {};

    if (name) {
      filter.name = { contains: name };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where: filter }),
    ]);

    return {
      data: products,
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
