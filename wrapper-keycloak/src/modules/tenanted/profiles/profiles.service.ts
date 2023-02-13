import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DATASOURCE } from '../../tenancy/tenancy.symbols';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfilesService {
  private readonly profileRepository: Repository<Profile>;
  private readonly roleRepository: Repository<Role>;

  constructor(@Inject(TENANT_DATASOURCE) dataSource: DataSource) {
    this.profileRepository = dataSource.getRepository(Profile);
    this.roleRepository = dataSource.getRepository(Role);
  }

  async create(createProfileDto: CreateProfileDto) {
    const roles = await this.roleRepository.find({
      where: { name: In(createProfileDto.roles) },
    });

    return this.profileRepository.save({
      name: createProfileDto.name,
      roles,
    });
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
