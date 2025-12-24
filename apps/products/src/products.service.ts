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
import { firstValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductsService implements IProductsService, OnModuleInit {
  private categoryGrpc: ICategoryGrpc;
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

  async create(dto: ProductCreateDto) {
    const product = await this.productsRepository.create(dto);

    return plainToInstance(ProductOutputDto, product, {
      enableImplicitConversion: true,
    });
  }

  async findById(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Category not found');
    }

    const category = await firstValueFrom(
      this.categoryGrpc.getCategory({
        id: product.categoryId!,
      }),
    );

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

    // Fetch category if product has one
    let category = null;
    if (product.categoryId) {
      try {
        category = await firstValueFrom(
          this.categoryGrpc.getCategory({
            id: product.categoryId,
          }),
        );
      } catch (error) {
        console.warn(
          `Category ${product.categoryId} not found for product`,
          error,
        );
      }
    }

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

    // Get unique category IDs
    const categoryIds = [
      ...new Set(
        products
          .map((product) => product.categoryId)
          .filter((id): id is string => id != null),
      ),
    ];

    // Fetch categories in batch if there are any
    let categoriesMap = new Map<string, CategoryResponse>();
    if (categoryIds.length > 0) {
      try {
        const { categories } = await firstValueFrom(
          this.categoryGrpc.getCategoriesBatch({ ids: categoryIds }),
        );
        categoriesMap = new Map(
          categories.map((cat: CategoryResponse) => [cat.id, cat]),
        );
      } catch (error) {
        console.warn('Failed to fetch categories', error);
      }
    }

    // Map products with their categories
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

    // Get unique category IDs
    const categoryIds = [
      ...new Set(
        products
          .map((product) => product.categoryId)
          .filter((id): id is string => id != null),
      ),
    ];

    // Fetch categories in batch if there are any
    let categoriesMap = new Map<string, CategoryResponse>();
    if (categoryIds.length > 0) {
      try {
        const { categories } = await firstValueFrom(
          this.categoryGrpc.getCategoriesBatch({ ids: categoryIds }),
        );
        categoriesMap = new Map(
          categories.map((cat: CategoryResponse) => [cat.id, cat]),
        );
      } catch (error) {
        console.warn('Failed to fetch categories', error);
      }
    }

    // Map products with their categories
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
