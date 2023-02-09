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
        `${this.configService.get(
          'KEYCLOAK_HOST',
        )}/realms/${tenant}/protocol/openid-connect/token`,
        new URLSearchParams({
          client_id: 'admin-cli',
          grant_type: 'password',
          username,
          password,
        }),
      ),
    ).catch((e) => {
      console.log(e)
      throw { message: 'invalid credentials', statusCode: 401 };
    });
    return data;
  }
}
