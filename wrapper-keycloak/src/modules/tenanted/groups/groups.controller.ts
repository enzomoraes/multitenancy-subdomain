import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { TenancyGuard } from '../../tenancy/tenancy.guard';
import { IKeycloakRealmRoles } from '../../auth/keycloak-facade/keycloak-facade.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(TenancyGuard)
  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @UseGuards(TenancyGuard)
  @Post(':id')
  assignRolesToGroup(
    @Param('id') id: string,
    @Body() keycloakRoles: IKeycloakRealmRoles[],
  ) {
    return this.groupsService.assignRolesToGroup(id, keycloakRoles);
  }

  @UseGuards(TenancyGuard)
  @Delete(':id')
  unassignRolesFromGroup(
    @Param('id') id: string,
    @Body() keycloakRoles: IKeycloakRealmRoles[],
  ) {
    return this.groupsService.unassignRolesFromGroup(id, keycloakRoles);
  }

  @UseGuards(TenancyGuard)
  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @UseGuards(TenancyGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @UseGuards(TenancyGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(id, updateGroupDto);
  }

  @UseGuards(TenancyGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}
