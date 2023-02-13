import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from '../../../../abstract.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity()
export class Profile extends AbstractEntity {
  @Column()
  name: string;

  @ManyToMany(() => Role, (role) => role.name, { cascade: true })
  @JoinTable()
  roles: Role[];
}
