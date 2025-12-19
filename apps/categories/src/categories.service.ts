import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriesRepository,
  ICategoriesService,
} from './interfaces/categories.interface';
import {
  CategoryCondDto,
  CategoryCreateDto,
  CategoryOutputDto,
  CategoryUpdateDto,
} from './dto';
import { CATEGORIES_REPOSITORY } from './categories.di-token';
import { BasePaginationResponse } from '@app/common';

@Injectable()
export class CategoriesService implements ICategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,
  ) {}

  async create(createDto: CategoryCreateDto): Promise<CategoryOutputDto> {
    return this.categoriesRepository.create(createDto);
  }

  async findById(id: string): Promise<CategoryOutputDto> {
    return this.categoriesRepository.findById(id);
  }

  async list(
    cond: CategoryCondDto,
  ): Promise<BasePaginationResponse<CategoryOutputDto>> {
    return this.categoriesRepository.list(cond);
  }

  async findByIds(ids: string[]): Promise<CategoryOutputDto[]> {
    return this.categoriesRepository.findByIds(ids);
  }

  async findByCond(cond: CategoryCondDto): Promise<CategoryOutputDto> {
    return this.categoriesRepository.findByCond(cond);
  }

  async update(
    id: string,
    updateDto: CategoryUpdateDto,
  ): Promise<CategoryOutputDto> {
    return this.categoriesRepository.update(id, updateDto);
  }
}
