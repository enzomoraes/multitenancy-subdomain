import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Role {
  @PrimaryColumn({ unique: true })
  name: string;
}
