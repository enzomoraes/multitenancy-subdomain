import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TenancyGuard } from '../../tenancy/tenancy.guard';
import { IKeycloakTokens } from '../keycloak-facade/keycloak-facade.service';
import { AuthService } from './auth.service';

@Controller('')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  public login(
    @Body() body: { username: string; password: string; tenant: string },
  ): Promise<IKeycloakTokens> {
    return this.authService.login(body.username, body.password, body.tenant);
  }

  @UseGuards(TenancyGuard)
  @Post('/exchange-token')
  public exchangeToken(
    @Body() body: { username: string; tenant: string },
  ): Promise<IKeycloakTokens> {
    return this.authService.exchangeToken(body.username, body.tenant);
  }
}
