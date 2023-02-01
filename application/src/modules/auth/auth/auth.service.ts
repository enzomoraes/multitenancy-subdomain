import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  async login(
    username: string,
    password: string,
    tenant: string,
  ): Promise<{ access_token: string }> {
    const { data } = await firstValueFrom(
      this.http.post(
        `http://${this.configService.get(
          'KEYCLOAK_HOST',
        )}/auth/realms/${tenant}/protocol/openid-connect/token`,
        new URLSearchParams({
          client_id: this.configService.get('KEYCLOAK_CLIENT_ID'),
          client_secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
          grant_type: 'password',
          username,
          password,
        }),
      ),
    ).catch(() => {
      return { data: { message: 'invalid credentials' } };
    });
    return data;
  }
}
