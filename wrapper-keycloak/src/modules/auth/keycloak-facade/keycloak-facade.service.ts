import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { CreateTenantDto } from 'src/modules/public/tenants/dto/create-tenant.dto';
import { CreateUserDto } from 'src/modules/tenanted/user/dto/create-user.dto';

export interface IKeycloakTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export default class KeycloakFacadeService {
  constructor(
    private configService: ConfigService,
    private http: HttpService,
  ) {}

  /**
   * This method is responsible for creating a tenant in keycloak
   * @param tenant information
   */
  async createTenant(tenant: CreateTenantDto) {
    const adminToken = await this.getAdminToken();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    return firstValueFrom(
      this.http
        .post(
          `${this.configService.get('KEYCLOAK_HOST')}/auth/admin/realms`,
          {
            realm: tenant.name,
            accessTokenLifespan: parseInt(
              this.configService.get('ACESS_TOKEN_LIFESPAN'),
            ),
            ssoSessionIdleTimeout: parseInt(
              this.configService.get('REFRESH_TOKEN_LIFESPAN'),
            ),
          },
          authHeader,
        )
        .pipe(
          catchError((err, obs) => {
            console.log(err);
            throw err;
          }),
        )
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method is responsible for creating a user in a tenant in keycloak
   * @param createUserDto
   * @param tenant
   */
  async createUser(createUserDto: CreateUserDto, tenant: string) {
    const adminToken = await this.getAdminToken();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    return firstValueFrom(
      this.http
        .post(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/auth/admin/realms/${tenant}/users`,
          {
            email: createUserDto.email,
            emailVerified: true,
            enabled: true,
            firstName: createUserDto.firstName,
            groups: [],
            lastName: createUserDto.lastName,
            username: createUserDto.username,
            attributes: { subdomain: tenant },
          },
          authHeader,
        )
        .pipe(
          catchError((err, obs) => {
            console.log(err);
            throw err;
          }),
        )
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method get the tokens from client to manage keycloak
   * @returns IKeycloakTokens
   */
  private async getAdminToken(): Promise<IKeycloakTokens> {
    const requestConfig: any = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    return firstValueFrom(
      this.http
        .post<IKeycloakTokens>(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/auth/realms/master/protocol/openid-connect/token`,
          new URLSearchParams({
            grant_type: 'password',
            username: this.configService.get('KEYCLOAK_ADMIN_USERNAME'),
            password: this.configService.get('KEYCLOAK_ADMIN_PASSWORD'),
            client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
            client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
          }),
          requestConfig,
        )
        .pipe(
          catchError((err, obs) => {
            throw err;
          }),
        )
        .pipe(
          map((response: any) => {
            return response.data;
          }),
        ),
    );
  }
}
