import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import KeycloakFacadeService from '../../auth/keycloak-facade/keycloak-facade.service';
import { getTenantConnection } from '../../tenancy/tenancy.utils';
import { UserService } from '../../tenanted/user/user.service';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { CreateUserDto } from 'src/modules/tenanted/user/dto/create-user.dto';
import { TenancyService } from 'src/modules/tenancy/tenancy.service';
import { User } from 'src/modules/tenanted/user/entities/user.entity';
import CreateTenantValidator from './validation/create-validation';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    private keycloakFacade: KeycloakFacadeService,
    private tenancyService: TenancyService,
    private createValidator: CreateTenantValidator,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    await this.createValidator.validate(createTenantDto);

    const parent = await this.tenantsRepository.findOne({
      where: { id: createTenantDto.parent },
    });

    await this.keycloakFacade.createTenant(createTenantDto);

    const tenant = new Tenant();
    tenant.name = createTenantDto.name;
    tenant.parent = parent;
    tenant.subdomain = this.generateSubdomain(
      createTenantDto.subdomain,
      parent?.subdomain,
    );

    const savedTenant = await this.tenantsRepository.save(tenant);
    const schemaName = `tenant_${savedTenant.name.toLowerCase()}`;

    await this.tenantsRepository.query(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );

    const dataSrcTenant = await getTenantConnection(
      savedTenant.name.toLowerCase(),
    );
    await dataSrcTenant.runMigrations();

    const newUser: CreateUserDto = {
      firstName: '',
      lastName: '',
      username: 'admin',
      email: '',
    };

    // criando usuario admin para o tenant criado
    await this.keycloakFacade.createUser(newUser, savedTenant.name);

    const user = new User();
    user.email = newUser.email;
    user.firstName = newUser.firstName;
    user.lastName = newUser.lastName;
    user.username = newUser.username;

    await dataSrcTenant.getRepository(User).save(user);
    await dataSrcTenant.destroy();

    return savedTenant;
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

  private generateSubdomain(
    subdomain: string,
    parentSubdomain: string | undefined,
  ): string {
    if (parentSubdomain) {
      return `${subdomain}.${parentSubdomain}`;
    }
    return subdomain;
  }
}
