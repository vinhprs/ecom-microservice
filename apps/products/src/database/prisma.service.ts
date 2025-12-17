import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClient } from '@prisma/products-client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly totalReplicas = 2;
  private readonly replicaUrls: string[] = [];

  private prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    this.createExtendedClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  private createExtendedClient() {
    const adapter = new PrismaPg({
      connectionString: this.configService.get<string>(
        'PRODUCTS_MASTER_DATABASE_URL',
      ),
    });

    console.log('adapter :>> ', adapter);

    this.prisma = new PrismaClient({ adapter });

    for (let i = 1; i <= this.totalReplicas; i++) {
      const databaseUrl = this.configService.get(
        `PRODUCTS_SLAVE_${i}_DATABASE_URL`,
      );
      this.replicaUrls.push(databaseUrl);
    }

    this.prisma.$extends(
      readReplicas({
        replicas: this.replicaUrls,
      }),
    );
  }

  get instance() {
    return this.prisma;
  }
}
