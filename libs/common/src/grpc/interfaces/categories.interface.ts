import { Observable } from 'rxjs';

export interface GetCategoryRequest {
  id: string;
}

export interface GetCategoriesBatchRequest {
  ids: string[];
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesBatchResponse {
  categories: CategoryResponse[];
}

export interface ICategoryGrpc {
  getCategory(data: GetCategoryRequest): Observable<CategoryResponse>;
  getCategoriesBatch(
    data: GetCategoriesBatchRequest,
  ): Observable<CategoriesBatchResponse>;
}
