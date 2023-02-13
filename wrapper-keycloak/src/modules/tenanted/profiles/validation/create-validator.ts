import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DATASOURCE } from '../../../tenancy/tenancy.symbols';
import { DataSource, Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { CreateProfileDto } from '../dto/create-profile.dto';
import CreateProfileException from '../exceptions/CreateProfileException';

@Injectable()
export default class CreateProfileValidator {
  private readonly profileRepository: Repository<Profile>;
  constructor(@Inject(TENANT_DATASOURCE) dataSource: DataSource) {
    this.profileRepository = dataSource.getRepository(Profile);
  }

  async validate(createProfileDto: CreateProfileDto): Promise<void> {
    if (!createProfileDto.name) {
      throw new CreateProfileException('name is required');
    }
    const existingProfile = await this.profileRepository.findOne({
      where: { name: createProfileDto.name },
    });
    if (existingProfile) {
      throw new CreateProfileException('profile already exists');
    }
  }
}
