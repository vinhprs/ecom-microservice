import { CategoryGrpcClientOptions } from '@app/common';
import { LoggerModule } from '@app/common/logger/logger.module';
import { Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { PrismaService } from './database/prisma.service';
import { ProductsRepository } from './database/products.repository';
import { ProductsController } from './products.controller';
import {
  PRODUCTS_PRISMA_SERVICE,
  PRODUCTS_REPOSITORY,
  PRODUCTS_SERVICE,
} from './products.di-token';
import { ProductsService } from './products.service';

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
    ClientsModule.register(CategoryGrpcClientOptions),
  ],
  controllers: [ProductsController],
  providers,
})
export class ProductsModule {}
