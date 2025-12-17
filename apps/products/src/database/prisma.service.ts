import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';
import { PrismaClient } from '@prisma/products-client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly totalReplicas = 2;
  private readonly replicaClients: PrismaClient[] = [];

  private primaryClient: PrismaClient;
  private extendedClient: ReturnType<typeof this.createExtendedClient>;

  constructor(private readonly configService: ConfigService) {
    this.extendedClient = this.createExtendedClient();
  }

  async onModuleInit() {
    await this.primaryClient.$connect();
  }

  async onModuleDestroy() {
    await this.primaryClient.$disconnect();
  }

  private createExtendedClient() {
    const adapter = new PrismaPg({
      connectionString: this.configService.get<string>(
        'PRODUCTS_MASTER_DATABASE_URL',
      ),
    });

    this.primaryClient = new PrismaClient({
      adapter,
    });

    for (let i = 1; i <= this.totalReplicas; i++) {
      const databaseUrl = this.configService.get(
        `PRODUCTS_SLAVE_${i}_DATABASE_URL`,
      );

      console.log('databaseUrl :>> ', databaseUrl);

      const replicaAdapter = new PrismaPg({
        connectionString: databaseUrl,
      });

      const replicaClient = new PrismaClient({
        adapter: replicaAdapter,
      });
      this.replicaClients.push(replicaClient);
    }

    return this.primaryClient.$extends(
      readReplicas({
        replicas: this.replicaClients,
      }),
    );
  }

  get instance() {
    return this.extendedClient;
  }

  get primaryInstance() {
    return this.primaryClient;
  }
}
