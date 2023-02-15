import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import _roles from '../../../_roles';
import { CreateTenantDto } from '../../public/tenants/dto/create-tenant.dto';
import { CreateUserDto } from '../../tenanted/user/dto/create-user.dto';

export interface IKeycloakTokens {
  access_token: string;
  refresh_token: string;
}

export interface IKeycloakRealmRoles {
  id: string;
  name: string;
  description: string;
  composite: boolean;
  clientRole: boolean;
  containerId: string;
}

@Injectable()
export default class KeycloakFacadeService {
  constructor(
    private configService: ConfigService,
    private http: HttpService,
  ) {}

  public async login(
    username: string,
    password: string,
    tenant: string,
  ): Promise<IKeycloakTokens> {
    return firstValueFrom(
      this.http
        .post(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/realms/${tenant}/protocol/openid-connect/token`,
          new URLSearchParams({
            client_id: 'admin-cli',
            grant_type: 'password',
            username,
            password,
          }),
        )
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method is responsible for creating a tenant in keycloak
   * @param tenant information
   */
  public async createTenant(tenant: CreateTenantDto) {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    await firstValueFrom(
      this.http.post(
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
      ),
    );
  }

  public async allowAllRealmRolesScope(tenant: string): Promise<void> {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const adminCliClient = await firstValueFrom(
      this.http.get(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/clients?clientId=admin-cli&search=true`,
        authHeader,
      ),
    );

    const adminCliClientId = adminCliClient.data[0].id;
    // http://localhost:28080/admin/realms/TENANT/clients/CLIENTID/scope-mappings/realm
    await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/clients/${adminCliClientId}/scope-mappings/realm`,
        await this.getRoles(tenant),
        authHeader,
      ),
    );
  }

  /**
   * This method creates openid scope for admin-cli so the admin-cli client can request userinfo to validate token
   * @param tenant tenant name
   */
  public async createOpenIdScopeForAdminCLIClient(
    tenant: string,
  ): Promise<void> {
    const tenantAdminToken = await this.getAdminTokenByTenant(tenant);
    const authHeader = {
      headers: {
        Authorization: `bearer ${tenantAdminToken.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    // http://0.0.0.0:28080/admin/realms/TENANT/client-scopes
    // adding client-scope openid to the realm so we can request userinfo
    const clientScopeResponse = await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/client-scopes`,
        {
          name: 'openid',
          description: '',
          attributes: {
            'consent.screen.text': '',
            'display.on.consent.screen': 'true',
            'include.in.token.scope': 'true',
            'gui.order': '',
          },
          type: 'default',
          protocol: 'openid-connect',
        },
        authHeader,
      ),
    );
    const clientScopeId = clientScopeResponse.headers.location.substring(
      clientScopeResponse.headers.location.lastIndexOf('/') + 1,
    );

    // http://0.0.0.0:28080/admin/realms/TENANT/clients?clientId=admin-cli&first=0&max=101&search=true
    const adminCliClient = await firstValueFrom(
      this.http.get(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/clients?clientId=admin-cli&search=true`,
        authHeader,
      ),
    );

    const adminCliClientId = adminCliClient.data[0].id;

    // http://0.0.0.0:28080/admin/realms/TENANT/clients/CLIENT-ID/default-client-scopes/CLIENT-SCOPE-ID
    // adding openid scope to admin-cli client
    await firstValueFrom(
      this.http.put(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/clients/${adminCliClientId}/default-client-scopes/${clientScopeId}`,
        {
          name: 'openid',
          description: '',
          attributes: {
            'consent.screen.text': '',
            'display.on.consent.screen': 'true',
            'include.in.token.scope': 'true',
            'gui.order': '',
          },
          type: 'default',
          protocol: 'openid-connect',
        },
        authHeader,
      ),
    );
  }

  /**
   * This method creates a mapper for subdomain attribute in the realm, so the attribute subdomain goes into the jwt token
   * @param tenant tenant name
   */
  public async createMapperForRealm(tenant: string): Promise<void> {
    const tenantAdminToken = await this.getAdminTokenByTenant(tenant);
    const authHeader = {
      headers: {
        Authorization: `bearer ${tenantAdminToken.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    // http://0.0.0.0:28080/admin/realms/TENANT/clients?clientId=admin-cli&first=0&max=101&search=true
    const adminCliClient = await firstValueFrom(
      this.http.get(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/clients?clientId=admin-cli&search=true`,
        authHeader,
      ),
    );

    const adminCliClientId = adminCliClient.data[0].id;

    // adding mapper for subdomain attribute
    // http://0.0.0.0:28080/admin/realms/TENANT/clients/83efe7f5-8dba-492c-9786-34bc0ec74d72/protocol-mappers/models
    const response = await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/clients/${adminCliClientId}/protocol-mappers/models`,
        {
          config: {
            'access.token.claim': 'true',
            'aggregate.attrs': false,
            'claim.name': 'subdomain',
            'id.token.claim': 'true',
            'jsonType.label': '',
            multivalued: false,
            'user.attribute': 'subdomain',
            'userinfo.token.claim': 'true',
          },
          name: 'subdomain',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-usermodel-attribute-mapper',
        },
        authHeader,
      ),
    );
  }

  /**
   * This method inserts predefined roles in newly created keycloak tenant
   * @param tenant
   */
  public async insertRolesInNewlyCreatedRealm(tenant: string): Promise<void> {
    const tenantAdminToken = await this.getAdminTokenByTenant(tenant);
    const authHeader = {
      headers: {
        Authorization: `bearer ${tenantAdminToken.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    for (const role of _roles) {
      // http://0.0.0.0:28080/admin/realms/master/roles
      await firstValueFrom(
        this.http.post(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/admin/realms/${tenant}/roles`,
          {
            description: '',
            name: role.name,
          },
          authHeader,
        ),
      );
    }
  }

  /**
   * This method is responsible for creating an admin user in a tenant in keycloak
   * @param createUserDto
   * @param tenant
   */
  public async createAdminUser(
    createUserDto: CreateUserDto,
    tenant: string,
  ): Promise<string> {
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

    await this.setClientRolesForUser(userId, tenant);
    return userId;
  }

  /**
   * This method is responsible for creating an user in a tenant in keycloak
   * @param createUserDto
   * @param tenant
   */
  public async createUser(
    createUserDto: CreateUserDto,
    tenant: string,
  ): Promise<string> {
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

    return userId;
  }

  /**
   * This method allows us to exchange an admin token by a user token in a tenant
   * @param targetUser user id or user name
   * @param targetTenant of which the token will be exchanged
   * @returns IKeycloakTokens
   */
  public async exchangeToken(
    targetUser: string,
    targetTenant: string,
  ): Promise<IKeycloakTokens> {
    const { access_token } = await this.getAdminTokenByTenant(targetTenant);
    const requestConfig = {
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
        .pipe(map((response) => response.data)),
    );
  }

  public async userInfo(tenant: string, token: string) {
    return firstValueFrom(
      this.http
        .get(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/realms/${tenant}/protocol/openid-connect/userinfo`,
          { headers: { authorization: token } },
        )
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method searches all realm roles in keycloak and assign it to a user
   * @param userId
   * @param tenant
   */
  public async assignAllRealmRolesForUser(userId: string, tenant: string) {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    // http://0.0.0.0:28080/admin/realms/LABFABER/users/2f9db479-377f-4449-a152-88cab9b0a034/role-mappings/realm/available?first=0&max=101
    // searching available roles so we set all to the user
    const rolesResponse = await firstValueFrom(
      this.http.get(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users/${userId}/role-mappings/realm/available?first=0&max=101`,
        authHeader,
      ),
    );
    // client: "account"
    // clientId: "c0d1dd45-5498-4985-be20-785c433ffe84"
    // description: "${role_view-groups}"
    // id: "97f7f0ee-5b43-439e-b72e-422f53e7ca6a"
    // role: "view-groups"
    const roles = rolesResponse.data;

    // http://0.0.0.0:28080/admin/realms/LABFABER/users/2f9db479-377f-4449-a152-88cab9b0a034/role-mappings/realm
    await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users/${userId}/role-mappings/realm`,
        roles,
        authHeader,
      ),
    );
  }

  /**
   * This method get all groups in a tenant in keycloak
   * @param tenant
   */
  public async getAllGroups(
    tenant: string,
  ): Promise<{ id: string; name: string }> {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    // http://localhost:28080/admin/realms/TENANT/groups
    return firstValueFrom(
      this.http
        .get(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/admin/realms/${tenant}/groups`,
          authHeader,
        )
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method get all groups in a tenant in keycloak
   * @param keycloakGroupId
   * @param tenant
   */
  public async getGroupRoles(
    keycloakGroupId: string,
    tenant: string,
  ): Promise<string[]> {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    // http://localhost:28080/admin/realms/TENANT/groups/GROUPID
    return firstValueFrom(
      this.http
        .get(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/admin/realms/${tenant}/groups/${keycloakGroupId}`,
          authHeader,
        )
        .pipe(map((response) => response.data.realmRoles)),
    );
  }

  /**
   * This method creates a group in keycloak at specific realm
   * @param name
   * @param tenant
   */
  public async createGroup(
    name: string,
    tenant: string,
  ): Promise<{ id: string }> {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    // http://localhost:28080/admin/realms/TENANT/groups
    return firstValueFrom(
      this.http
        .post(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/admin/realms/${tenant}/groups`,
          { name },
          authHeader,
        )
        .pipe(
          map((response) => ({
            id: response.headers.location.substring(
              response.headers.location.lastIndexOf('/') + 1,
            ),
          })),
        ),
    );
  }

  /**
   * This method updates a group in keycloak at specific realm
   * @param keycloakGroupId
   * @param name
   * @param tenant
   */
  public async updateGroup(
    keycloakGroupId: string,
    name: string,
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
    //   http://localhost:28080/admin/realms/TENANT/groups/GROUPID
    await firstValueFrom(
      this.http.put(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/groups/${keycloakGroupId}`,
        { name },
        authHeader,
      ),
    );
  }

  /**
   * This method removes a group in keycloak at specific realm
   * @param keycloakGroupId
   * @param name
   * @param tenant
   */
  public async removeGroup(
    keycloakGroupId: string,
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
    //   http://localhost:28080/admin/realms/TENANT/groups/GROUPID
    await firstValueFrom(
      this.http.delete(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/groups/${keycloakGroupId}`,
        authHeader,
      ),
    );
  }

  /**
   * This method assigns a group to an user
   * @param keycloakUserId
   * @param keycloakGroupId
   * @param tenant
   */
  public async assignGroupToUser(
    keycloakUserId: string,
    keycloakGroupId: string,
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

    // http://localhost:28080/admin/realms/TENANTS/users/USERID/groups/GROUPID
    await firstValueFrom(
      this.http.put(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/users/${keycloakUserId}/groups/${keycloakGroupId}`,
        {},
        authHeader,
      ),
    );
  }

  /**
   * This method assigns roles to a group in keycloak in a tenant
   * @param keycloakGroupId
   * @param keycloakRoles
   * @param tenant
   */
  public async assignRolesToGroup(
    keycloakGroupId: string,
    keycloakRoles: IKeycloakRealmRoles[],
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

    // http://localhost:28080/admin/realms/TENANTS/groups/GROUPID/role-mappings/realm
    await firstValueFrom(
      this.http.post(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/groups/${keycloakGroupId}/role-mappings/realm`,
        keycloakRoles,
        authHeader,
      ),
    );
  }

  public async unassignRolesFromGroup(
    keycloakGroupId: string,
    keycloakRoles: IKeycloakRealmRoles[],
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

    // http://localhost:28080/admin/realms/TENANT/groups/GROUPID/role-mappings/realm
    await firstValueFrom(
      this.http.delete(
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/admin/realms/${tenant}/groups/${keycloakGroupId}/role-mappings/realm`,
        { data: keycloakRoles, ...authHeader },
      ),
    );
  }

  /**
   * This method fetchs all roles in a realm in keycloak
   * @param tenant
   */
  public async getRoles(tenant: string): Promise<IKeycloakRealmRoles[]> {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    // http://localhost:28080/admin/realms/TENANT/roles?first=0&max=101
    return firstValueFrom(
      this.http
        .get(
          `${this.configService.get(
            'KEYCLOAK_HOST',
          )}/admin/realms/${tenant}/roles`,
          authHeader,
        )
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method searches all client roles in keycloak and assign it to a user
   * @param userId
   * @param tenant
   */
  private async setClientRolesForUser(userId: string, tenant: string) {
    const adminToken = await this.getAdminTokenMaster();
    const accessToken = adminToken.access_token;
    const authHeader = {
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

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
   * This method get the tokens from application defined client to manage keycloak
   * @returns IKeycloakTokens
   */
  private async getAdminTokenMaster(): Promise<IKeycloakTokens> {
    const requestConfig = {
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
        .pipe(map((response) => response.data)),
    );
  }

  /**
   * This method get the tokens from admin-cli from a defined realm
   * @returns IKeycloakTokens
   */
  private async getAdminTokenByTenant(
    tenant: string,
  ): Promise<IKeycloakTokens> {
    const requestConfig = {
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
        .pipe(map((response) => response.data)),
    );
  }
}
