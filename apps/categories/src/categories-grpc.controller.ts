import { Controller, Inject, NotFoundException } from '@nestjs/common';
import { CATEGORIES_SERVICE } from './categories.di-token';
import { ICategoriesService } from './interfaces/categories.interface';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CategoriesBatchResponse,
  CategoryResponse,
  GetCategoriesBatchRequest,
  GetCategoryRequest,
} from '@app/common';

@Controller()
export class CategoriesGrpcController {
  constructor(
    @Inject(CATEGORIES_SERVICE)
    private readonly categoriesService: ICategoriesService,
  ) {}

  @GrpcMethod('CategoryService', 'GetCategory')
  async getCategory(payload: GetCategoryRequest): Promise<CategoryResponse> {
    console.log('payload :>> ', payload);
    const category = await this.categoriesService.findById(payload.id);

    if (!category) {
      throw new NotFoundException(`Category with id ${payload.id} not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt?.toISOString() || '',
    };
  }

  @GrpcMethod('CategoryService', 'GetCategoriesBatch')
  async getCategoriesBatch(
    payload: GetCategoriesBatchRequest,
  ): Promise<CategoriesBatchResponse> {
    const categories = await this.categoriesService.findByIds(payload.ids);
    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt?.toISOString() || '',
      })),
    };
  }
}
