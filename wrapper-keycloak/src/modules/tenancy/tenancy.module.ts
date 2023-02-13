import { Global, Module, Scope } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

import { REQUEST } from '@nestjs/core';

import { decode } from 'jsonwebtoken';
import { TenancyService } from './tenancy.service';
import { TENANT_DATASOURCE } from './tenancy.symbols';
import { getTenantConnection } from './tenancy.utils';

@Global()
@Module({
  providers: [
    TenancyService,
    {
      provide: TENANT_DATASOURCE,
      scope: Scope.REQUEST,
      useFactory: (request: ExpressRequest) => {
        const { authorization } = request.headers;
        if (!authorization) {
          throw new Error('subdomain not present');
        }
        try {
          const { subdomain } = decode(authorization.split(' ')[1]) as any;

          console.log('changing datasource to tenant_%s', subdomain);

          return getTenantConnection(subdomain);
        } catch (e) {
          throw new Error('Could not change datasource');
        }
      },
      inject: [REQUEST, TenancyService],
    },
  ],
  exports: [TENANT_DATASOURCE, TenancyService],
})
export class TenancyModule {}
