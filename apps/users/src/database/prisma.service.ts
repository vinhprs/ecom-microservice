import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/users-client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly shards: Map<number, PrismaClient> = new Map();
  private readonly totalShards = 4;

  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeShards();
  }

  private initializeShards() {
    for (let i = 1; i <= this.totalShards; i++) {
      const databaseUrl = this.configService.get(`USERS_SHARD_${i}_URL`);

      const adapter = new PrismaPg({ connectionString: databaseUrl });
      const prismaClient = new PrismaClient({
        adapter,
      });

      this.shards.set(i - 1, prismaClient);
    }
  }

  async onModuleInit() {
    for (const [shardId, client] of this.shards.entries()) {
      await client.$connect();
      this.logger.log(`Connected to shard ${shardId}`);
    }
  }

  async onModuleDestroy() {
    // Disconnect all shards
    for (const [shardId, client] of this.shards.entries()) {
      await client.$disconnect();
      this.logger.log(`Disconnected from shard ${shardId}`);
    }
  }

  /**
   * Get Prisma client for a specific shard
   */
  getShard(shardId: number): PrismaClient {
    const client = this.shards.get(shardId);
    if (!client) {
      throw new Error(`Shard ${shardId} not found`);
    }
    return client;
  }
}
