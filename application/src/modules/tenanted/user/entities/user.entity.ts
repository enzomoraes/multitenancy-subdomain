import { AbstractEntity } from '../../../../abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends AbstractEntity {
  @Column()
  name: string;
}
