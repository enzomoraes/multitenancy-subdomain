import { AbstractEntity } from '../../../../abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Tenant extends AbstractEntity {
  @Column()
  subdomain: string;
}
