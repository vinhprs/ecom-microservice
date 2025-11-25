import { CustomEntity } from '@app/common';
import { AbstractEntity } from '@app/common/database';
import { Column } from 'typeorm';

@CustomEntity(UsersEntity.name)
export class UsersEntity extends AbstractEntity {
  @Column('varchar', { length: 100, nullable: false })
  name: string;

  @Column('varchar', { length: 100, nullable: false })
  email: string;

  @Column('varchar', { length: 100, nullable: false })
  password: string;
}
