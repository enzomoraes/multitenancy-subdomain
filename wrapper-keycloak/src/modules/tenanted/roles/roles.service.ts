import { Injectable } from '@nestjs/common';
import KeycloakFacadeService from 'src/modules/auth/keycloak-facade/keycloak-facade.service';
import { TenancyService } from 'src/modules/tenancy/tenancy.service';

@Injectable()
export class RolesService {
  constructor(
    private tenancyService: TenancyService,
    private keycloakFacade: KeycloakFacadeService,
  ) {}

  findAll() {
    return this.keycloakFacade.getRoles(this.tenancyService.subdomain);
  }
}
