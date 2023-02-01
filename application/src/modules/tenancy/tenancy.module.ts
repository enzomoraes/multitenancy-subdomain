import { Global, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request as ExpressRequest } from 'express';
import { TenancyService } from './tenancy.service';
import { CONNECTION } from './tenancy.symbols';
import { getTenantConnection } from './tenancy.utils';
import { decode } from 'jsonwebtoken';
import { getConnection } from 'typeorm';

@Global()
@Module({
  providers: [
    TenancyService,
    {
      provide: CONNECTION,
      scope: Scope.REQUEST,
      useFactory: (request: ExpressRequest) => {
        const { authorization } = request.headers;
        if (authorization) {
          const { subdomain } = decode(authorization.split(' ')[1]) as any;
          return getTenantConnection(subdomain);
        }
        console.log('usando conexao default')
        return getConnection();

        throw new Error('No token found');
      },
      inject: [REQUEST],
    },
  ],
  exports: [CONNECTION],
})
export class TenancyModule {}
