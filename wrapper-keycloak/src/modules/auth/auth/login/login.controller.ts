import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Controller('login')
export class LoginController {
  constructor(private authService: AuthService) {}

  @Post()
  public login(
    @Body() body: { username: string; password: string; tenant: string },
  ): Promise<{ access_token: string }> {
    return this.authService.login(body.username, body.password, body.tenant);
  }
}
