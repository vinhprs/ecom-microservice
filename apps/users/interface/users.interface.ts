import { UserProfile } from '@prisma/users-client';
import {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileCondDto,
} from '../src/dto';

export interface IUsersRepository {
  findById(id: string): Promise<UserProfile | null>;
  findByCond(cond: UserProfileCondDto): Promise<UserProfile | null>;
  create(createDto: CreateUserProfileDto): Promise<UserProfile>;
  updateOne(id: string, updateDto: UpdateUserProfileDto): Promise<UserProfile>;
  deleteOne(id: string): Promise<void>;
}
