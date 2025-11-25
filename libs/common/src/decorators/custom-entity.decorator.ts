import { Entity } from 'typeorm';
import { toSnakeCase } from '..';

export const CustomEntity = (name: string) =>
  Entity(toSnakeCase(name) as string);
