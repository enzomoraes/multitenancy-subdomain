import { Injectable } from '@nestjs/common';
import KeycloakFacadeService, {
  IKeycloakTokens,
} from '../keycloak-facade/keycloak-facade.service';

@Injectable()
export class AuthService {
  constructor(private keycloakFacade: KeycloakFacadeService) {}

  async login(
    username: string,
    password: string,
    tenant: string,
  ): Promise<IKeycloakTokens> {
    try {
      return this.keycloakFacade.login(username, password, tenant);
    } catch (e) {
      console.log(e);
      throw { message: 'invalid credentials', statusCode: 401 };
    }
  }
}
