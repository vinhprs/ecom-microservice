import { AbstractEntity } from '.';
import {
  Repository,
  FindOneOptions,
  FindManyOptions,
  FindOptionsWhere,
  DeepPartial,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';

import { v7 as uuidv7 } from 'uuid';

import { NotFoundException } from '@nestjs/common';
export class AbstractRepository<TEntity extends AbstractEntity> {
  constructor(private readonly repository: Repository<TEntity>) {}

  async create(entity: DeepPartial<TEntity>): Promise<TEntity> {
    const createdEntity = this.repository.create({
      id: uuidv7(),
      ...entity,
    });
    return this.repository.save(createdEntity);
  }

  async findOne(filterQuery: FindOneOptions<TEntity>): Promise<TEntity | null> {
    const entity = await this.repository.findOne(filterQuery);
    if (!entity) return null;

    return entity as TEntity;
  }

  async findAll(filterQuery: FindManyOptions<TEntity>): Promise<TEntity[]> {
    const entities = await this.repository.find(filterQuery);
    return entities;
  }

  async updateOne(
    filterQuery: FindOptionsWhere<TEntity>,
    entity: DeepPartial<TEntity>,
  ): Promise<TEntity> {
    const exist = await this.findOne({ where: filterQuery });
    if (!exist) throw new NotFoundException('Entity not found');

    this.repository.merge(exist, entity);

    return this.repository.save(exist);
  }

  async updateMany(
    filterQuery: FindOptionsWhere<TEntity>,
    entity: DeepPartial<TEntity>,
  ): Promise<UpdateResult> {
    return this.repository.update(filterQuery, entity as any);
  }

  async deleteOne(filterQuery: FindOptionsWhere<TEntity>): Promise<boolean> {
    const result = await this.repository.delete(filterQuery);
    return !!(result.affected && result.affected > 0);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<TEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
