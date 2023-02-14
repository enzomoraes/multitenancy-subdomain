import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { TENANT_DATASOURCE } from '../../tenancy/tenancy.symbols';
import KeycloakFacadeService from '../../auth/keycloak-facade/keycloak-facade.service';
import { TenancyService } from '../../tenancy/tenancy.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';

@Injectable()
export class UserService {
  private readonly usersRepository: Repository<User>;
  private readonly profilesRepository: Repository<Profile>;

  constructor(
    @Inject(TENANT_DATASOURCE) dataSource: DataSource,
    private keycloakFacade: KeycloakFacadeService,
    private tenancyService: TenancyService,
  ) {
    this.usersRepository = dataSource.getRepository(User);
    this.profilesRepository = dataSource.getRepository(Profile);
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

  async assignProfiles(userId: string, profileIds: string[]) {
    const profiles = await this.profilesRepository.find({
      where: { id: In(profileIds) },
    });

    // TODO: inserir roles no keycloak
    const user = await this.usersRepository.findOneBy({ id: userId });
    user.profiles = profiles;

    return this.usersRepository.save(user);
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
