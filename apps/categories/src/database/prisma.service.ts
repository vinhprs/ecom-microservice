import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/categories-client';
import { readReplicas } from '@prisma/extension-read-replicas';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
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
        'CATEGORIES_MASTER_DATABASE_URL',
      ),
    });

    this.primaryClient = new PrismaClient({
      adapter,
    });

    const databaseUrl = this.configService.get<string>(
      'CATEGORIES_SLAVE_DATABASE_URL',
    );

    const replicaAdapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    const replicaClient = new PrismaClient({
      adapter: replicaAdapter,
    });

    return this.primaryClient.$extends(
      readReplicas({
        replicas: [replicaClient],
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
