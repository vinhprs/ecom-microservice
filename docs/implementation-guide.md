# Implementation Guide - NestJS Microservices

## Project Structure

```
flash-sale-ecommerce/
├── apps/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── auth.module.ts
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── users-service/
│   │   ├── src/
│   │   │   ├── users/
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.repository.ts
│   │   │   │   └── users.module.ts
│   │   │   ├── database/
│   │   │   │   ├── sharding.service.ts
│   │   │   │   └── database.module.ts
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── products-service/
│   │   ├── src/
│   │   │   ├── products/
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   └── products.module.ts
│   │   │   ├── cache/
│   │   │   │   └── cache.service.ts
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── orders-service/
│   │   ├── src/
│   │   │   ├── orders/
│   │   │   │   ├── orders.controller.ts
│   │   │   │   ├── orders.service.ts
│   │   │   │   ├── orders.producer.ts
│   │   │   │   ├── orders.consumer.ts
│   │   │   │   └── orders.module.ts
│   │   │   ├── inventory/
│   │   │   │   └── inventory.service.ts
│   │   │   ├── database/
│   │   │   │   └── sharding.service.ts
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── notifications-service/
│       ├── src/
│       │   ├── notifications/
│       │   │   ├── notifications.controller.ts
│       │   │   ├── notifications.service.ts
│       │   │   ├── notifications.consumer.ts
│       │   │   └── notifications.module.ts
│       │   ├── main.ts
│       │   └── app.module.ts
│       ├── Dockerfile
│       └── package.json
│
├── libs/
│   ├── common/
│   │   ├── src/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── filters/
│   │   │   └── interfaces/
│   │   └── index.ts
│   │
│   └── config/
│       ├── src/
│       │   ├── database.config.ts
│       │   ├── redis.config.ts
│       │   ├── rabbitmq.config.ts
│       │   └── kafka.config.ts
│       └── index.ts
│
├── k8s/
│   ├── base/
│   │   ├── namespace.yaml
│   │   └── configmap.yaml
│   │
│   ├── services/
│   │   ├── auth-service/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── hpa.yaml
│   │   ├── orders-service/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── hpa.yaml
│   │   └── ...
│   │
│   ├── databases/
│   │   ├── postgres-shard-1.yaml
│   │   ├── postgres-shard-2.yaml
│   │   ├── redis-cluster.yaml
│   │   └── pgbouncer.yaml
│   │
│   ├── messaging/
│   │   ├── rabbitmq.yaml
│   │   └── kafka.yaml
│   │
│   └── monitoring/
│       ├── prometheus.yaml
│       ├── grafana.yaml
│       └── jaeger.yaml
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── nest-cli.json
└── package.json
```

---

## 1. Database Sharding Implementation

### sharding.service.ts
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

interface ShardConfig {
  shardId: number;
  dataSource: DataSource;
}

@Injectable()
export class ShardingService {
  private readonly logger = new Logger(ShardingService.name);
  private shards: Map<number, DataSource> = new Map();
  private readonly totalShards = 4;

  constructor(
    private readonly shard1: DataSource,
    private readonly shard2: DataSource,
    private readonly shard3: DataSource,
    private readonly shard4: DataSource,
  ) {
    this.shards.set(0, shard1);
    this.shards.set(1, shard2);
    this.shards.set(2, shard3);
    this.shards.set(3, shard4);
    this.logger.log(`Initialized ${this.totalShards} database shards`);
  }

  /**
   * Calculate shard ID from a given key
   */
  getShardId(key: string): number {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    const numericHash = parseInt(hash.slice(0, 8), 16);
    return numericHash % this.totalShards;
  }

  /**
   * Get DataSource for a specific shard
   */
  getDataSource(shardId: number): DataSource {
    const dataSource = this.shards.get(shardId);
    if (!dataSource) {
      throw new Error(`Shard ${shardId} not found`);
    }
    return dataSource;
  }

  /**
   * Get DataSource based on a sharding key
   */
  getDataSourceByKey(key: string): DataSource {
    const shardId = this.getShardId(key);
    return this.getDataSource(shardId);
  }

  /**
   * Execute query on all shards (for scatter-gather operations)
   */
  async executeOnAllShards<T>(
    callback: (dataSource: DataSource) => Promise<T>,
  ): Promise<T[]> {
    const promises = Array.from(this.shards.values()).map((dataSource) =>
      callback(dataSource),
    );
    return Promise.all(promises);
  }

  /**
   * Get shard distribution stats
   */
  async getShardStats(): Promise<any[]> {
    const stats = [];
    
    for (const [shardId, dataSource] of this.shards.entries()) {
      const result = await dataSource.query(`
        SELECT 
          '${shardId}' as shard_id,
          COUNT(*) as user_count
        FROM users
      `);
      
      stats.push(result[0]);
    }
    
    return stats;
  }
}
```

### database.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ShardingService } from './sharding.service';

@Module({
  imports: [
    // Shard 1
    TypeOrmModule.forRootAsync({
      name: 'shard1',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_SHARD1_HOST'),
        port: configService.get('DB_SHARD1_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        poolSize: 100,
      }),
      inject: [ConfigService],
    }),
    
    // Shard 2
    TypeOrmModule.forRootAsync({
      name: 'shard2',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_SHARD2_HOST'),
        port: configService.get('DB_SHARD2_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        poolSize: 100,
      }),
      inject: [ConfigService],
    }),
    
    // Shard 3
    TypeOrmModule.forRootAsync({
      name: 'shard3',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_SHARD3_HOST'),
        port: configService.get('DB_SHARD3_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        poolSize: 100,
      }),
      inject: [ConfigService],
    }),
    
    // Shard 4
    TypeOrmModule.forRootAsync({
      name: 'shard4',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_SHARD4_HOST'),
        port: configService.get('DB_SHARD4_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        poolSize: 100,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ShardingService],
  exports: [ShardingService],
})
export class DatabaseModule {}
```

---

## 2. Users Service with Sharding

### users.service.ts
```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ShardingService } from '../database/sharding.service';
import { CacheService } from '../cache/cache.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly shardingService: ShardingService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new user (write to master shard)
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const userId = this.generateUserId();
    const shardId = this.shardingService.getShardId(userId);
    
    this.logger.log(`Creating user ${userId} in shard ${shardId}`);
    
    const dataSource = this.shardingService.getDataSource(shardId);
    const userRepository = dataSource.getRepository(User);
    
    const user = userRepository.create({
      id: userId,
      ...createUserDto,
    });
    
    const savedUser = await userRepository.save(user);
    
    // Cache the user
    await this.cacheService.set(
      `user:${userId}`,
      savedUser,
      3600, // 1 hour TTL
    );
    
    return savedUser;
  }

  /**
   * Find user by ID (read from replica if available)
   */
  async findOne(userId: string): Promise<User> {
    // Try cache first
    const cached = await this.cacheService.get<User>(`user:${userId}`);
    if (cached) {
      this.logger.debug(`Cache hit for user ${userId}`);
      return cached;
    }
    
    // Cache miss - read from database
    this.logger.debug(`Cache miss for user ${userId}`);
    
    const dataSource = this.shardingService.getDataSourceByKey(userId);
    const userRepository = dataSource.getRepository(User);
    
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    
    // Update cache
    await this.cacheService.set(`user:${userId}`, user, 3600);
    
    return user;
  }

  /**
   * Update user (write to master shard)
   */
  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const dataSource = this.shardingService.getDataSourceByKey(userId);
    const userRepository = dataSource.getRepository(User);
    
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    
    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();
    
    const updatedUser = await userRepository.save(user);
    
    // Invalidate cache
    await this.cacheService.del(`user:${userId}`);
    
    return updatedUser;
  }

  /**
   * Delete user (write to master shard)
   */
  async remove(userId: string): Promise<void> {
    const dataSource = this.shardingService.getDataSourceByKey(userId);
    const userRepository = dataSource.getRepository(User);
    
    const result = await userRepository.delete(userId);
    
    if (result.affected === 0) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    
    // Invalidate cache
    await this.cacheService.del(`user:${userId}`);
  }

  /**
   * Get total user count across all shards
   */
  async getTotalCount(): Promise<number> {
    const counts = await this.shardingService.executeOnAllShards(
      async (dataSource) => {
        const result = await dataSource.query('SELECT COUNT(*) as count FROM users');
        return parseInt(result[0].count);
      },
    );
    
    return counts.reduce((sum, count) => sum + count, 0);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 3. Orders Service with Redis Inventory & RabbitMQ

### inventory.service.ts
```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Initialize inventory for a product
   */
  async initInventory(productId: string, quantity: number): Promise<void> {
    const key = this.getInventoryKey(productId);
    await this.redis.set(key, quantity);
    this.logger.log(`Initialized inventory for ${productId}: ${quantity} units`);
  }

  /**
   * Reserve inventory (atomic decrement)
   */
  async reserveInventory(
    productId: string,
    quantity: number,
  ): Promise<{ success: boolean; remaining: number }> {
    const key = this.getInventoryKey(productId);
    const lockKey = this.getLockKey(productId);
    
    try {
      // Acquire lock
      const lockAcquired = await this.redis.set(
        lockKey,
        '1',
        'EX',
        10, // 10 seconds
        'NX',
      );
      
      if (!lockAcquired) {
        throw new BadRequestException('Could not acquire inventory lock');
      }
      
      // Check current inventory
      const current = await this.redis.get(key);
      const currentInventory = parseInt(current || '0');
      
      if (currentInventory < quantity) {
        return { success: false, remaining: currentInventory };
      }
      
      // Atomic decrement
      const remaining = await this.redis.decrby(key, quantity);
      
      if (remaining < 0) {
        // Rollback if oversold
        await this.redis.incrby(key, quantity);
        this.logger.warn(`Inventory oversold for ${productId}, rolled back`);
        return { success: false, remaining: 0 };
      }
      
      this.logger.log(
        `Reserved ${quantity} units for ${productId}, ${remaining} remaining`,
      );
      
      return { success: true, remaining };
    } finally {
      // Release lock
      await this.redis.del(lockKey);
    }
  }

  /**
   * Release reserved inventory (in case of order cancellation)
   */
  async releaseInventory(productId: string, quantity: number): Promise<void> {
    const key = this.getInventoryKey(productId);
    await this.redis.incrby(key, quantity);
    this.logger.log(`Released ${quantity} units for ${productId}`);
  }

  /**
   * Get current inventory
   */
  async getInventory(productId: string): Promise<number> {
    const key = this.getInventoryKey(productId);
    const inventory = await this.redis.get(key);
    return parseInt(inventory || '0');
  }

  /**
   * Preload flash sale inventory (before flash sale starts)
   */
  async preloadFlashSaleInventory(
    products: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const { productId, quantity } of products) {
      const key = this.getInventoryKey(productId);
      pipeline.set(key, quantity);
    }
    
    await pipeline.exec();
    
    this.logger.log(`Preloaded inventory for ${products.length} flash sale products`);
  }

  private getInventoryKey(productId: string): string {
    return `inventory:${productId}`;
  }

  private getLockKey(productId: string): string {
    return `inventory:lock:${productId}`;
  }
}
```

### orders.service.ts
```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { ShardingService } from '../database/sharding.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderProducer } from './orders.producer';
import { CreateOrderDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly shardingService: ShardingService,
    private readonly inventoryService: InventoryService,
    private readonly orderProducer: OrderProducer,
  ) {}

  /**
   * Create a regular order
   */
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // 1. Reserve inventory
    const inventoryResult = await this.inventoryService.reserveInventory(
      createOrderDto.productId,
      createOrderDto.quantity,
    );
    
    if (!inventoryResult.success) {
      throw new BadRequestException('Product out of stock');
    }
    
    try {
      // 2. Create order in database
      const orderId = uuidv4();
      const dataSource = this.shardingService.getDataSourceByKey(userId);
      const orderRepository = dataSource.getRepository(Order);
      
      const order = orderRepository.create({
        id: orderId,
        userId,
        status: OrderStatus.PENDING,
        ...createOrderDto,
      });
      
      const savedOrder = await orderRepository.save(order);
      
      // 3. Publish order created event to RabbitMQ
      await this.orderProducer.publishOrderCreated(savedOrder);
      
      this.logger.log(`Order ${orderId} created for user ${userId}`);
      
      return savedOrder;
    } catch (error) {
      // Rollback inventory reservation
      await this.inventoryService.releaseInventory(
        createOrderDto.productId,
        createOrderDto.quantity,
      );
      throw error;
    }
  }

  /**
   * Create flash sale order (optimized for high concurrency)
   */
  async createFlashSaleOrder(
    userId: string,
    productId: string,
  ): Promise<Order> {
    // 1. Check idempotency key (prevent double orders)
    const idempotencyKey = `order:${userId}:${productId}:${Date.now()}`;
    const existingOrderId = await this.checkIdempotency(idempotencyKey);
    
    if (existingOrderId) {
      this.logger.log(`Duplicate order attempt for user ${userId}`);
      return this.findOne(existingOrderId);
    }
    
    // 2. Reserve inventory (atomic)
    const inventoryResult = await this.inventoryService.reserveInventory(
      productId,
      1,
    );
    
    if (!inventoryResult.success) {
      throw new BadRequestException('Flash sale product sold out');
    }
    
    try {
      // 3. Create order
      const orderId = uuidv4();
      const dataSource = this.shardingService.getDataSourceByKey(userId);
      const orderRepository = dataSource.getRepository(Order);
      
      const order = orderRepository.create({
        id: orderId,
        userId,
        productId,
        quantity: 1,
        status: OrderStatus.PENDING,
        isFlashSale: true,
      });
      
      const savedOrder = await orderRepository.save(order);
      
      // 4. Store idempotency key
      await this.storeIdempotency(idempotencyKey, orderId, 300); // 5 minutes
      
      // 5. Publish to queue (async processing)
      await this.orderProducer.publishOrderCreated(savedOrder);
      
      this.logger.log(`Flash sale order ${orderId} created`);
      
      return savedOrder;
    } catch (error) {
      // Rollback
      await this.inventoryService.releaseInventory(productId, 1);
      throw error;
    }
  }

  /**
   * Find order by ID
   */
  async findOne(orderId: string): Promise<Order> {
    // For simplicity, query all shards (can be optimized by storing user_id)
    const orders = await this.shardingService.executeOnAllShards(
      async (dataSource) => {
        const orderRepository = dataSource.getRepository(Order);
        return orderRepository.findOne({ where: { id: orderId } });
      },
    );
    
    const order = orders.find((o) => o !== null);
    
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    
    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(orderId);
    
    const dataSource = this.shardingService.getDataSourceByKey(order.userId);
    const orderRepository = dataSource.getRepository(Order);
    
    order.status = status;
    order.updatedAt = new Date();
    
    return orderRepository.save(order);
  }

  private async checkIdempotency(key: string): Promise<string | null> {
    // Implement using Redis
    return null;
  }

  private async storeIdempotency(
    key: string,
    orderId: string,
    ttl: number,
  ): Promise<void> {
    // Implement using Redis
  }
}
```

### orders.producer.ts
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Order } from './entities/order.entity';

interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  timestamp: Date;
}

@Injectable()
export class OrderProducer {
  private readonly logger = new Logger(OrderProducer.name);

  constructor(@InjectQueue('orders') private readonly orderQueue: Queue) {}

  async publishOrderCreated(order: Order): Promise<void> {
    const event: OrderCreatedEvent = {
      orderId: order.id,
      userId: order.userId,
      productId: order.productId,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      timestamp: new Date(),
    };
    
    await this.orderQueue.add('order.created', event, {
      priority: order.isFlashSale ? 10 : 5, // Flash sale orders have higher priority
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    
    this.logger.log(`Published order.created event for order ${order.id}`);
  }
}
```

### orders.consumer.ts
```typescript
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrdersService } from './orders.service';
import { OrderStatus } from './entities/order.entity';

interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  timestamp: Date;
}

@Processor('orders')
export class OrderConsumer {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Process('order.created')
  async handleOrderCreated(job: Job<OrderCreatedEvent>): Promise<void> {
    const { orderId, userId, productId, totalAmount } = job.data;
    
    this.logger.log(`Processing order ${orderId}`);
    
    try {
      // 1. Process payment (mock)
      await this.processPayment(orderId, totalAmount);
      
      // 2. Update order status
      await this.ordersService.updateStatus(orderId, OrderStatus.PAID);
      
      // 3. Send notification (via another queue)
      // await this.notificationProducer.sendOrderConfirmation(userId, orderId);
      
      // 4. Publish to Kafka for analytics
      // await this.kafkaProducer.publishOrderCompleted(job.data);
      
      this.logger.log(`Order ${orderId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process order ${orderId}:`, error);
      throw error; // Will trigger retry
    }
  }

  private async processPayment(
    orderId: string,
    amount: number,
  ): Promise<void> {
    // Mock payment processing
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.log(`Payment processed for order ${orderId}: $${amount}`);
  }
}
```

---

## 4. Cache Service (Redis)

### cache.service.ts
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      this.logger.error(`Error getting multiple cache keys:`, error);
      return keys.map(() => null);
    }
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const { key, value, ttl } of entries) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Error setting multiple cache keys:`, error);
    }
  }
}
```

---

## 5. Docker Compose for Local Development

```yaml
version: '3.8'

services:
  # PostgreSQL Shards
  postgres-shard-1:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pg-shard-1-data:/var/lib/postgresql/data

  postgres-shard-2:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - pg-shard-2-data:/var/lib/postgresql/data

  postgres-shard-3:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"
    volumes:
      - pg-shard-3-data:/var/lib/postgresql/data

  postgres-shard-4:
    image: postgres:15
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5435:5432"
    volumes:
      - pg-shard-4-data:/var/lib/postgresql/data

  # Redis Cluster
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

  # Kafka + Zookeeper
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  pg-shard-1-data:
  pg-shard-2-data:
  pg-shard-3-data:
  pg-shard-4-data:
  redis-data:
  rabbitmq-data:
```

---

## 6. Kubernetes Deployment Example

### orders-service-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-service
  namespace: production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: orders-service
  template:
    metadata:
      labels:
        app: orders-service
    spec:
      containers:
      - name: orders-service
        image: your-registry/orders-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_SHARD1_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: shard1-host
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: host
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: orders-service
  namespace: production
spec:
  selector:
    app: orders-service
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: orders-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: orders-service
  minReplicas: 10
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

---

## Next Steps

1. **Clone the repo structure**
2. **Implement each service step by step**
3. **Test locally with Docker Compose**
4. **Load test with k6**
5. **Deploy to K8s (Minikube → AWS EKS)**
6. **Document your journey in PROGRESS.md**

Good luck với side project! 🚀
