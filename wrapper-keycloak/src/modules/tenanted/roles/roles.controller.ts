import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenancyGuard } from '../../tenancy/tenancy.guard';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @UseGuards(TenancyGuard)
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }
}
