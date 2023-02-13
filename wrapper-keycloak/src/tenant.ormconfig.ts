import { ormconfig } from './ormconfig';

import { join } from 'path';
import { DataSource } from 'typeorm';

export const tenantormconfig = {
  ...ormconfig,
  entities: [join(__dirname, './modules/tenanted/**/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/tenanted/*{.ts,.js}')],
};

// para gerar migrations é necessario exportar um data source
// export const ds = new DataSource(tenantormconfig);
