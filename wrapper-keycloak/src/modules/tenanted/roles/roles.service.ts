import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DATASOURCE } from '../../tenancy/tenancy.symbols';
import { DataSource, Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  private readonly rolesRepository: Repository<Role>;

  constructor(@Inject(TENANT_DATASOURCE) dataSource: DataSource) {
    this.rolesRepository = dataSource.getRepository(Role);
  }

  findAll() {
    return this.rolesRepository.find();
  }
}
