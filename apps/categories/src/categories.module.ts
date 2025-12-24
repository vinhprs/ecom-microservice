import { Module, Provider } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './database/categories.repository';
import {
  CATEGORIES_PRISMA_SERVICE,
  CATEGORIES_REPOSITORY,
  CATEGORIES_SERVICE,
} from './categories.di-token';
import { PrismaService } from './database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@app/common';
import { CategoriesGrpcController } from './categories-grpc.controller';

const providers: Provider[] = [
  {
    provide: CATEGORIES_PRISMA_SERVICE,
    useClass: PrismaService,
  },
  {
    provide: CATEGORIES_REPOSITORY,
    useClass: CategoriesRepository,
  },
  {
    provide: CATEGORIES_SERVICE,
    useClass: CategoriesService,
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
  ],
  controllers: [CategoriesController, CategoriesGrpcController],
  providers,
})
export class CategoriesModule {}
