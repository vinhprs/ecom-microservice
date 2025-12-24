import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductCondDto, ProductCreateDto, ProductUpdateDto } from './dto';
import { IProductsService } from './interfaces/products.interface';
import { PRODUCTS_SERVICE } from './products.di-token';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: IProductsService,
  ) {}

  @Post()
  create(@Body() dto: ProductCreateDto) {
    return this.productsService.create(dto);
  }

  @Get(':id')
  getProduct(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get()
  list(@Query() cond: ProductCondDto) {
    return this.productsService.list(cond);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: ProductUpdateDto) {
    return this.productsService.update(id, dto);
  }
}
