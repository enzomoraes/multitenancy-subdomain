import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { TENANT_DATASOURCE } from '../../tenancy/tenancy.symbols';
import KeycloakFacadeService from '../../auth/keycloak-facade/keycloak-facade.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly usersRepository: Repository<User>;

  constructor(
    @Inject(TENANT_DATASOURCE) dataSource: DataSource,
    private keycloakFacade: KeycloakFacadeService,
    private tenancyService: TenancyService,
  ) {
    this.usersRepository = dataSource.getRepository(User);
  }

  async create(createUserDto: CreateUserDto) {
    const keycloakUserId = await this.keycloakFacade.createUser(
      createUserDto,
      this.tenancyService.subdomain,
    );

    const user = new User();
    user.email = createUserDto.email;
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.username = createUserDto.username;
    user.keycloakId = keycloakUserId;

    return this.usersRepository.save(user);
  }

  async assignGroup(userId: string, groupId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return this.keycloakFacade.assignGroupToUser(
      user.keycloakId,
      groupId,
      this.tenancyService.subdomain,
    );
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
