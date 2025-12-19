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
import { CATEGORIES_SERVICE } from './categories.di-token';
import { CategoryCondDto, CategoryCreateDto, CategoryUpdateDto } from './dto';
import { ICategoriesService } from './interfaces/categories.interface';

@Controller('categories')
export class CategoriesController {
  constructor(
    @Inject(CATEGORIES_SERVICE)
    private readonly categoriesService: ICategoriesService,
  ) {}

  @Post()
  create(@Body() createDto: CategoryCreateDto) {
    return this.categoriesService.create(createDto);
  }

  @Get()
  async list(@Query() cond: CategoryCondDto) {
    return this.categoriesService.list(cond);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: CategoryUpdateDto) {
    return this.categoriesService.update(id, updateDto);
  }
}
