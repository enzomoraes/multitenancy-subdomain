import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { Tenant } from '../entities/tenant.entity';
import CreateTenantException from '../exceptions/CreateTenantException';

@Injectable()
export default class CreateTenantValidator {
  constructor(
    @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
  ) {}

  async validate(createTenantDto: CreateTenantDto): Promise<void> {
    if (!createTenantDto.name) {
      throw new CreateTenantException('name is required');
    }
    if (!createTenantDto.subdomain) {
      throw new CreateTenantException('subdomain is required');
    }
    const existingTenant = await this.tenantRepository.findOne({
      where: { name: createTenantDto.name },
    });
    if (existingTenant) {
      throw new CreateTenantException('tenant already exists');
    }
  }
}
