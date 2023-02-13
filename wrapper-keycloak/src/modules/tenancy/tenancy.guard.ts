import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import KeycloakFacadeService from '../auth/keycloak-facade/keycloak-facade.service';
import { TenancyService } from './tenancy.service';

@Injectable()
export class TenancyGuard implements CanActivate {
  constructor(
    private tenancyService: TenancyService,
    private keycloakFacade: KeycloakFacadeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException();
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException();

    try {
      const payload = decode(token) as any;
      const subdomain = payload.subdomain;

      // validating token in keycloak
      await this.keycloakFacade.userInfo(subdomain, authHeader);
      this.tenancyService.subdomain = subdomain;

      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
