import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { AbstractEntity } from '../../../../abstract.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity()
export class User extends AbstractEntity {
  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  username: string;

  @Column()
  keycloakId: string;

  @ManyToMany(() => Profile)
  @JoinTable()
  profiles: Profile[];
}
