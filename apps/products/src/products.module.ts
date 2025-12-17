import { Module, Provider } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@app/common/logger/logger.module';
import {
  PRODUCTS_PRISMA_SERVICE,
  PRODUCTS_REPOSITORY,
  PRODUCTS_SERVICE,
} from './products.di-token';
import { ProductsRepository } from './database/products.repository';
import { PrismaService } from './database/prisma.service';

const providers: Provider[] = [
  {
    provide: PRODUCTS_PRISMA_SERVICE,
    useClass: PrismaService,
  },
  {
    provide: PRODUCTS_REPOSITORY,
    useClass: ProductsRepository,
  },
  {
    provide: PRODUCTS_SERVICE,
    useClass: ProductsService,
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/apps/products/.env',
    }),
    LoggerModule,
  ],
  controllers: [ProductsController],
  providers,
})
export class ProductsModule {}
