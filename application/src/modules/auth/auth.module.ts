import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { LoginController } from './auth/login/login.controller';
import { JwtStrategyService } from './jwt-strategy/jwt-strategy.service';
import KeycloakFacadeService from './keycloak-facade/keycloak-facade.service';

@Module({
  imports: [HttpModule],
  providers: [AuthService, JwtStrategyService, KeycloakFacadeService],
  controllers: [LoginController],
  exports: [KeycloakFacadeService],
})
export class AuthModule {}
