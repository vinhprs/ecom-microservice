import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginationParamsDto {
  @IsOptional()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsNumber()
  limit: number = 100;
}
