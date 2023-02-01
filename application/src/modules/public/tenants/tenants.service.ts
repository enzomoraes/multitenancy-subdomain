import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { getTenantConnection } from 'src/modules/tenancy/tenancy.utils';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    let tenant = new Tenant();
    tenant.subdomain = createTenantDto.subdomain;

    tenant = await this.tenantsRepository.save(tenant);

    const schemaName = `tenant_${tenant.subdomain}`;

    await this.tenantsRepository.query(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );

    const connection = await getTenantConnection(`${tenant.subdomain}`);
    console.log('subdomain connection name', tenant.subdomain);
    await connection.runMigrations();
    await connection.close();

    return tenant;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantsRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} tenant`;
  }

  update(id: number, updateTenantDto: UpdateTenantDto) {
    return `This action updates a #${id} tenant`;
  }

  remove(id: number) {
    return `This action removes a #${id} tenant`;
  }
}
