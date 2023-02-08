import { Global, Module, Scope } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { tenantormconfig } from '../../tenant.ormconfig';
import { DataSource } from 'typeorm';

import { REQUEST } from '@nestjs/core';

import { decode } from 'jsonwebtoken';
import { TenancyService } from './tenancy.service';
import { TENANT_DATASOURCE } from './tenancy.symbols';

@Global()
@Module({
  providers: [
    TenancyService,
    {
      provide: TENANT_DATASOURCE,
      scope: Scope.REQUEST,
      useFactory: (request: ExpressRequest, dataSource: DataSource) => {
        const { authorization } = request.headers;
        if (!authorization) {
          throw new Error('subdomain not present');
        }

        const { subdomain } = decode(authorization.split(' ')[1]) as any;

        console.log('changing datasource to tenant_%s', subdomain);

        const ds = dataSource.setOptions({
          ...tenantormconfig,
          schema: `tenant_${subdomain}`,
        });
        console.log('data src', ds.options);
        return ds;
      },
      inject: [REQUEST, DataSource, TenancyService],
    },
  ],
  exports: [TENANT_DATASOURCE, TenancyService],
})
export class TenancyModule {}
