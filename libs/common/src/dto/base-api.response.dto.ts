import { Expose } from 'class-transformer';

export class BasePaginationResponse<T> {
  @Expose()
  data: T[];

  @Expose()
  total: number;

  @Expose()
  totalPages: number;
}

export class BaseApiResponse<T> {
  @Expose()
  data: T;

  @Expose()
  message: string;

  @Expose()
  code: number;
}
