import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ShardingService {
  private readonly totalShards = 4;

  getShardId(key: string): number {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    const numericHash = parseInt(hash.slice(0, 8), 16);
    const shardId = numericHash % this.totalShards;

    return shardId;
  }
}
