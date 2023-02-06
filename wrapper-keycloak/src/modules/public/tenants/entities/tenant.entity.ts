import { AbstractEntity } from '../../../../abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Tenant extends AbstractEntity {
  @Column()
  subdomain: string;

  @Column()
  name: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.parent)
  parent?: Tenant;

  @OneToMany(() => Tenant, (tenant) => tenant.children)
  children: Tenant[];
}
