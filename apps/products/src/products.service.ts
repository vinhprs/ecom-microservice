import {
  BasePaginationResponse,
  CategoryResponse,
  GRPC_SERVICES,
  ICategoryGrpc,
} from '@app/common';
import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  ProductCondDto,
  ProductCreateDto,
  ProductOutputDto,
  ProductUpdateDto,
} from './dto';
import {
  IProductsRepository,
  IProductsService,
} from './interfaces/products.interface';
import { PRODUCTS_REPOSITORY } from './products.di-token';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductsService implements IProductsService, OnModuleInit {
  private categoryGrpc: ICategoryGrpc;
  private readonly GRPC_TIMEOUT = 5000;

  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
    @Inject(GRPC_SERVICES.CATEGORY)
    private readonly categoryClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.categoryGrpc =
      this.categoryClient.getService<ICategoryGrpc>('CategoryService');
  }

  private async fetchCategoryWithFallback(
    categoryId: string,
  ): Promise<CategoryResponse | null> {
    try {
      return await firstValueFrom(
        this.categoryGrpc.getCategory({ id: categoryId }).pipe(
          timeout(this.GRPC_TIMEOUT),
          catchError(() => {
            return of(null);
          }),
        ),
      );
    } catch {
      return null;
    }
  }

  private async fetchCategoriesBatchWithFallback(
    categoryIds: string[],
  ): Promise<Map<string, CategoryResponse>> {
    if (categoryIds.length === 0) {
      return new Map();
    }

    try {
      const response = await firstValueFrom(
        this.categoryGrpc.getCategoriesBatch({ ids: categoryIds }).pipe(
          timeout(this.GRPC_TIMEOUT),
          catchError(() => {
            return of({ categories: [] });
          }),
        ),
      );

      return new Map(
        response.categories.map((cat: CategoryResponse) => [cat.id, cat]),
      );
    } catch {
      return new Map();
    }
  }

  async create(dto: ProductCreateDto) {
    const product = await this.productsRepository.create(dto);

    return plainToInstance(ProductOutputDto, product, {
      enableImplicitConversion: true,
    });
  }

  async findById(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const category = product.categoryId
      ? await this.fetchCategoryWithFallback(product.categoryId)
      : null;

    return plainToInstance(
      ProductOutputDto,
      {
        ...product,
        category,
      },
      {
        enableImplicitConversion: true,
      },
    );
  }

  async findByCond(cond: ProductCondDto) {
    const product = await this.productsRepository.findByCond(cond);

    const category = product.categoryId
      ? await this.fetchCategoryWithFallback(product.categoryId)
      : null;

    return plainToInstance(
      ProductOutputDto,
      {
        ...product,
        category,
      },
      {
        enableImplicitConversion: true,
      },
    );
  }

  async update(id: string, updateDto: ProductUpdateDto) {
    const product = await this.productsRepository.update(id, updateDto);

    return plainToInstance(ProductOutputDto, product, {
      enableImplicitConversion: true,
    });
  }

  async findByIds(ids: string[]) {
    const products = await this.productsRepository.findByIds(ids);

    const categoryIds = [
      ...new Set(
        products
          .map((product) => product.categoryId)
          .filter((id): id is string => id != null),
      ),
    ];

    const categoriesMap =
      await this.fetchCategoriesBatchWithFallback(categoryIds);

    const productsWithCategories = products.map((product) => ({
      ...product,
      category: product.categoryId
        ? categoriesMap.get(product.categoryId) || null
        : null,
    }));

    return plainToInstance(ProductOutputDto, productsWithCategories, {
      enableImplicitConversion: true,
    });
  }

  async list(
    cond: ProductCondDto,
  ): Promise<BasePaginationResponse<ProductOutputDto>> {
    const {
      data: products,
      total,
      totalPages,
    } = await this.productsRepository.list(cond);

    const categoryIds = [
      ...new Set(
        products
          .map((product) => product.categoryId)
          .filter((id): id is string => id != null),
      ),
    ];

    const categoriesMap =
      await this.fetchCategoriesBatchWithFallback(categoryIds);

    const productsWithCategories = products.map((product) => ({
      ...product,
      category: product.categoryId
        ? categoriesMap.get(product.categoryId) || null
        : null,
    }));

    return {
      data: plainToInstance(ProductOutputDto, productsWithCategories, {
        enableImplicitConversion: true,
      }),
      total,
      totalPages,
    };
  }
}
