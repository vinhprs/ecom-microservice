import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/auth-client';
import { v7 as uuidv7 } from 'uuid';
import { AuthCondDto, AuthUserUpdateDto, RegisterDto } from '../dto';
import { IAuthRepository } from '../interface/auth.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    return user;
  }

  async findByCond(cond: AuthCondDto): Promise<User | null> {
    const user = await this.prisma.user.findFirst({ where: cond });

    return user;
  }

  async create(createDto: RegisterDto): Promise<User> {
    const { email, password, fullName } = createDto;
    const user = await this.prisma.user.create({
      data: { id: uuidv7(), email, password, fullName },
    });

    return user;
  }

  async updateOne(id: string, updateDto: AuthUserUpdateDto): Promise<User> {
    const { fullName, password, refreshToken } = updateDto;
    const user = await this.prisma.user.update({
      where: { id },
      data: { fullName, password, refreshToken },
    });

    return user;
  }

  async deleteOne(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
