import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormconfig } from './ormconfig';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './modules/auth/auth/auth.service';
import { JwtStrategyService } from './modules/auth/jwt-strategy/jwt-strategy.service';
import { TenantsModule } from './modules/public/tenants/tenants.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { UserModule } from './modules/tenanted/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(ormconfig),
    HttpModule,
    TenancyModule,
    TenantsModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService, JwtStrategyService],
})
export class AppModule {}
