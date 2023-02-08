import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map } from 'rxjs';
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
    const adminToken = await this.getAdminTokenMaster();
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
          `${this.configService.get('KEYCLOAK_HOST')}/admin/realms`,
          {
            enabled: true,
            realm: tenant.name,
            accessTokenLifespan: parseInt(
              this.configService.get('ACCESS_TOKEN_LIFESPAN'),
            ),
            ssoSessionIdleTimeout: parseInt(
              this.configService.get('REFRESH_TOKEN_LIFESPAN'),
            ),
          },
          authHeader,
        )
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method is responsible for creating an admin user in a tenant in keycloak
   * @param createUserDto
   * @param tenant
   */
  async createAdminUser(
    createUserDto: CreateUserDto,
    tenant: string,
  ): Promise<void> {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const userCreationResponse = await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users`,
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
      ),
    );

    const userId = userCreationResponse.headers.location.substring(
      userCreationResponse.headers.location.lastIndexOf('/') + 1,
    );

    // setting password for user
    await firstValueFrom(
      this.http.put(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users/${userId}/reset-password`,
        {
          temporary: false,
          type: 'password',
          value: createUserDto.password,
        },
        authHeader,
      ),
    );

    // searching available roles so we set all to the user
    const rolesResponse = await firstValueFrom(
      this.http.get(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/admin-ui-available-roles/users/${userId}?first=0&max=101&search=`,
        authHeader,
      ),
    );
    // client: "account"
    // clientId: "c0d1dd45-5498-4985-be20-785c433ffe84"
    // description: "${role_view-groups}"
    // id: "97f7f0ee-5b43-439e-b72e-422f53e7ca6a"
    // role: "view-groups"
    const roles = rolesResponse.data;

    // não sei ao certo oq essa requisicao faz, mas é necessária
    //0.0.0.0:28080/admin/realms/REALM/users/USERID/role-mappings/realm
    await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users/${userId}/role-mappings/realm`,
        [],
        authHeader,
      ),
    );

    for (const role of roles) {
      // http://0.0.0.0:28080/admin/realms/REALM/users/USERID/role-mappings/clients/CLIENTID_ROLE
      await firstValueFrom(
        this.http.post(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/admin/realms/${tenant}/users/${userId}/role-mappings/clients/${
            role.clientId
          }`,
          [
            {
              description: role.description,
              id: role.id,
              name: role.role,
            },
          ],
          authHeader,
        ),
      );
    }
  }

  /**
   * This method is responsible for creating an user in a tenant in keycloak
   * @param createUserDto
   * @param tenant
   */
  async createUser(
    createUserDto: CreateUserDto,
    tenant: string,
  ): Promise<void> {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const userCreationResponse = await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users`,
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
      ),
    );

    const userId = userCreationResponse.headers.location.substring(
      userCreationResponse.headers.location.lastIndexOf('/') + 1,
    );

    // setting password for user
    await firstValueFrom(
      this.http.put(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users/${userId}/reset-password`,
        {
          temporary: false,
          type: 'password',
          value: createUserDto.password,
        },
        authHeader,
      ),
    );
  }

  /**
   * This method allows us to exchange an admin token by a user token in a tenant
   * @param targetUser user id or user name
   * @param targetTenant of which the token will be exchanged
   * @returns IKeycloakTokens
   */
  async exchangeToken(
    targetUser: string,
    targetTenant: string,
  ): Promise<IKeycloakTokens> {
    const { access_token } = await this.getAdminTokenByTenant(targetTenant);
    const requestConfig: any = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    return firstValueFrom(
      this.http
        .post<IKeycloakTokens>(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/realms/${targetTenant}/protocol/openid-connect/token`,
          new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
            requested_token_type:
              'urn:ietf:params:oauth:token-type:refresh_token',
            client_id: 'admin-cli',
            subject_token: access_token,
            requested_subject: targetUser,
          }),
          requestConfig,
        )
        .pipe(
          map((response: any) => {
            return response.data;
          }),
        ),
    );
  }

  /**
   * This method get the tokens from application defined client to manage keycloak
   * @returns IKeycloakTokens
   */
  private async getAdminTokenMaster(): Promise<IKeycloakTokens> {
    const requestConfig: any = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    return firstValueFrom(
      this.http
        .post<IKeycloakTokens>(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/realms/master/protocol/openid-connect/token`,
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
          map((response: any) => {
            return response.data;
          }),
        ),
    );
  }

  /**
   * This method get the tokens from admin-cli from a defined realm
   * @returns IKeycloakTokens
   */
  private async getAdminTokenByTenant(
    tenant: string,
  ): Promise<IKeycloakTokens> {
    const requestConfig: any = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    return firstValueFrom(
      this.http
        .post<IKeycloakTokens>(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/realms/${tenant}/protocol/openid-connect/token`,
          new URLSearchParams({
            grant_type: 'password',
            username: this.configService.get('KEYCLOAK_ADMIN_USERNAME'),
            password: this.configService.get('KEYCLOAK_ADMIN_PASSWORD'),
            client_id: 'admin-cli',
          }),
          requestConfig,
        )
        .pipe(
          map((response: any) => {
            return response.data;
          }),
        ),
    );
  }
}
