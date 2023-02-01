import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import { config } from 'dotenv';
import { DataSource } from 'typeorm';
config();

const configService = new ConfigService();
export const ormconfig = {
  type: 'postgres' as any,
  host: configService.get('POSTGRES_HOST'),
  port: configService.get('POSTGRES_PORT'),
  username: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  database: configService.get('POSTGRES_DB'),
  logging: true,
  autoLoadEntities: true,
  entities: [join(__dirname, './modules/public/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/public/*{.ts,.js}')],
  name: 'default'
};

// para gerar migrations é necessario exportar um data source
export const ds = new DataSource(ormconfig);
