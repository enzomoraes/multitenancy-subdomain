import { Injectable } from '@nestjs/common';
import KeycloakFacadeService, {
  IKeycloakRealmRoles,
} from 'src/modules/auth/keycloak-facade/keycloak-facade.service';
import { TenancyService } from 'src/modules/tenancy/tenancy.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private keycloakFacade: KeycloakFacadeService,
    private tenancyService: TenancyService,
  ) {}

  create(createGroupDto: CreateGroupDto) {
    return this.keycloakFacade.createGroup(
      createGroupDto.name,
      this.tenancyService.subdomain,
    );
  }

  findAll() {
    return this.keycloakFacade.getAllGroups(this.tenancyService.subdomain);
  }

  findOne(id: string) {
    return this.keycloakFacade.getGroupRoles(id, this.tenancyService.subdomain);
  }

  update(id: string, updateGroupDto: UpdateGroupDto) {
    return this.keycloakFacade.updateGroup(
      id,
      updateGroupDto.name,
      this.tenancyService.subdomain,
    );
  }

  remove(id: string) {
    return this.keycloakFacade.removeGroup(id, this.tenancyService.subdomain);
  }

  assignRolesToGroup(id: string, keycloakRoles: IKeycloakRealmRoles[]) {
    return this.keycloakFacade.assignRolesToGroup(
      id,
      keycloakRoles,
      this.tenancyService.subdomain,
    );
  }

  unassignRolesFromGroup(id: string, keycloakRoles: IKeycloakRealmRoles[]) {
    return this.keycloakFacade.unassignRolesFromGroup(
      id,
      keycloakRoles,
      this.tenancyService.subdomain,
    );
  }
}
