import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { ShardingService } from './database/sharding.service';
import { CreateUserProfileDto, UpdateUserProfileDto } from './dto';
import { IUsersService } from './interface/users.interface';
import { PRISMA_SERVICE } from '../users.di-token';
import { SHARDING_SERVICE } from '../users.di-token';

@Injectable()
export class UsersService implements IUsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prismaService: PrismaService,
    @Inject(SHARDING_SERVICE) private readonly shardingService: ShardingService,
  ) {}

  async createProfile(dto: CreateUserProfileDto) {
    const { id, email, fullName } = dto;

    // Determine which shard to use
    const shardId = this.shardingService.getShardId(id);
    const shard = this.prismaService.getShard(shardId);

    this.logger.log(`Creating user profile in shard ${shardId}`);

    const profile = await shard.userProfile.create({
      data: {
        id,
        email,
        fullName,
      },
    });

    return profile;
  }

  /**
   * Get user profile by ID
   * Kong adds X-User-Id header
   */
  async getProfile(userId: string) {
    const shardId = this.shardingService.getShardId(userId);
    const shard = this.prismaService.getShard(shardId);

    const profile = await shard.userProfile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const shardId = this.shardingService.getShardId(userId);
    const shard = this.prismaService.getShard(shardId);

    // Check if profile exists
    const existingProfile = await shard.userProfile.findUnique({
      where: { id: userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Update profile
    const updatedProfile = await shard.userProfile.update({
      where: { id: userId },
      data: dto,
    });

    this.logger.log(`Profile updated: ${userId}`);
    return updatedProfile;
  }

  /**
   * Delete user profile
   */
  async deleteProfile(id: string) {
    const shardId = this.shardingService.getShardId(id);
    const shard = this.prismaService.getShard(shardId);

    await shard.userProfile.delete({
      where: { id },
    });

    this.logger.log(`Profile deleted: ${id}`);
  }
}
