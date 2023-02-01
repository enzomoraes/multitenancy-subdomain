import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { LoginController } from './auth/login/login.controller';
import { JwtStrategyService } from './jwt-strategy/jwt-strategy.service';

@Module({
  imports: [HttpModule],
  providers: [AuthService, JwtStrategyService],
  controllers: [LoginController],
})
export class AuthModule {}
