import { UserProfile, Address } from '../../prisma/generated/users-client';
import {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileCondDto,
  CreateAddressDto,
  UpdateAddressDto,
} from '../dto';

export interface IUsersRepository {
  // UserProfile operations
  findById(id: string): Promise<UserProfile | null>;
  findByCond(cond: UserProfileCondDto): Promise<UserProfile | null>;
  create(createDto: CreateUserProfileDto): Promise<UserProfile>;
  updateOne(id: string, updateDto: UpdateUserProfileDto): Promise<UserProfile>;
  deleteOne(id: string): Promise<UserProfile>;

  // Address operations
  findAddressById(id: string, userId: string): Promise<Address | null>;
  findAddressesByUserId(userId: string): Promise<Address[]>;
  createAddress(userId: string, createDto: CreateAddressDto): Promise<Address>;
  updateAddress(
    id: string,
    userId: string,
    updateDto: UpdateAddressDto,
  ): Promise<Address>;
  deleteAddress(id: string, userId: string): Promise<Address>;
}

export interface IUsersService {
  // UserProfile operations
  getProfile(userId: string): Promise<UserProfile>;
  createProfile(createDto: CreateUserProfileDto): Promise<UserProfile>;
  updateProfile(
    id: string,
    updateDto: UpdateUserProfileDto,
  ): Promise<UserProfile>;
  deleteProfile(id: string): Promise<void>;
}
