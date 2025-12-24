import { Inject, Injectable } from '@nestjs/common';
import { ICategoriesRepository } from '../interfaces/categories.interface';
import { PrismaService } from './prisma.service';
import {
  CategoryCondDto,
  CategoryCreateDto,
  CategoryOutputDto,
  CategoryUpdateDto,
} from '../dto';
import { CATEGORIES_PRISMA_SERVICE } from '../categories.di-token';
import { Prisma, PrismaClient } from '../../prisma/generated/categories-client';
import { v7 as uuidv7 } from 'uuid';
import { plainToInstance } from 'class-transformer';
import { BasePaginationResponse } from '@app/common';

@Injectable()
export class CategoriesRepository implements ICategoriesRepository {
  private prisma: PrismaClient;
  constructor(
    @Inject(CATEGORIES_PRISMA_SERVICE)
    private readonly prismaService: PrismaService,
  ) {
    this.prisma = this.prismaService.instance as unknown as PrismaClient;
  }

  async create(createDto: CategoryCreateDto): Promise<CategoryOutputDto> {
    const category = await this.prisma.category.create({
      data: {
        id: uuidv7(),
        ...createDto,
      },
    });
    return plainToInstance(CategoryOutputDto, category);
  }

  async findById(id: string): Promise<CategoryOutputDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    return plainToInstance(CategoryOutputDto, category);
  }

  async findByIds(ids: string[]): Promise<CategoryOutputDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids } },
    });
    return plainToInstance(CategoryOutputDto, categories);
  }

  async findByCond(cond: CategoryCondDto): Promise<CategoryOutputDto> {
    const { name } = cond;

    const filter: Prisma.CategoryWhereInput = {};

    if (name) {
      filter.name = { contains: name };
    }

    const category = await this.prisma.category.findFirst({
      where: filter,
    });

    return plainToInstance(CategoryOutputDto, category);
  }

  async list(
    cond: CategoryCondDto,
  ): Promise<BasePaginationResponse<CategoryOutputDto>> {
    const { name, page, limit } = cond;

    const filter: Prisma.CategoryWhereInput = {};

    if (name) {
      filter.name = { contains: name };
    }
    const skip = (page - 1) * limit;
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where: filter,
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where: filter }),
    ]);

    return {
      data: plainToInstance(CategoryOutputDto, categories),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    updateDto: CategoryUpdateDto,
  ): Promise<CategoryOutputDto> {
    const category = await this.prisma.category.update({
      where: { id },
      data: updateDto,
    });
    return plainToInstance(CategoryOutputDto, category);
  }
}
