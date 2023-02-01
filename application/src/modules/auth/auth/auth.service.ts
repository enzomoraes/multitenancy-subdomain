import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(private http: HttpService) {}

  async login(username: string, password: string) {
    const { data } = await firstValueFrom(
      this.http.post(
        `http://${process.env.KEYCLOAK_HOST}/auth/realms/fullcycle/protocol/openid-connect/token`,
        new URLSearchParams({
          client_id: 'wrapper',
          client_secret: '57441e32-b353-40a5-81e3-75cda25e6b5e',
          grant_type: 'password',
          username,
          password,
        }),
      ),
    );
    return data;
  }
}
