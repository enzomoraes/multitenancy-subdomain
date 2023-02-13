import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DATASOURCE } from '../../tenancy/tenancy.symbols';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import CreateProfileValidator from './validation/create-validator';

@Injectable()
export class ProfilesService {
  private readonly profileRepository: Repository<Profile>;
  private readonly roleRepository: Repository<Role>;

  constructor(
    @Inject(TENANT_DATASOURCE) dataSource: DataSource,
    private createProfileValidator: CreateProfileValidator,
  ) {
    this.profileRepository = dataSource.getRepository(Profile);
    this.roleRepository = dataSource.getRepository(Role);
  }

  async create(createProfileDto: CreateProfileDto) {
    await this.createProfileValidator.validate(createProfileDto);
    
    const roles = await this.roleRepository.find({
      where: { name: In(createProfileDto.roles) },
    });

    const profile = new Profile();
    profile.name = createProfileDto.name;
    profile.roles = [...roles];

    return this.profileRepository.save(profile);
  }

  findAll() {
    return this.profileRepository.find({ relations: ['roles'] });
  }

  findOne(id: string) {
    return this.profileRepository.find({ where: { id }, relations: ['roles'] });
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    const roles = await this.roleRepository.find({
      where: { name: In(updateProfileDto.roles) },
    });

    return this.profileRepository.update(id, {
      name: updateProfileDto.name,
      roles,
    });
  }

  remove(id: string) {
    return this.profileRepository.delete(id);
  }
}
