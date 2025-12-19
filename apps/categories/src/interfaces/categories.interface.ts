import { BasePaginationResponse } from '@app/common';
import {
  CategoryCondDto,
  CategoryCreateDto,
  CategoryOutputDto,
  CategoryUpdateDto,
} from '../dto';

export interface ICategoriesService {
  create(dto: CategoryCreateDto): Promise<CategoryOutputDto>;
  findById(id: string): Promise<CategoryOutputDto>;
  findByIds(ids: string[]): Promise<CategoryOutputDto[]>;
  findByCond(cond: CategoryCondDto): Promise<CategoryOutputDto>;
  list(
    cond: CategoryCondDto,
  ): Promise<BasePaginationResponse<CategoryOutputDto>>;
  update(id: string, updateDto: CategoryUpdateDto): Promise<CategoryOutputDto>;
}

export interface ICategoriesRepository {
  create(createDto: CategoryCreateDto): Promise<CategoryOutputDto>;
  findById(id: string): Promise<CategoryOutputDto>;
  findByIds(ids: string[]): Promise<CategoryOutputDto[]>;
  findByCond(cond: CategoryCondDto): Promise<CategoryOutputDto>;
  list(
    cond: CategoryCondDto,
  ): Promise<BasePaginationResponse<CategoryOutputDto>>;
  update(id: string, updateDto: CategoryUpdateDto): Promise<CategoryOutputDto>;
}
