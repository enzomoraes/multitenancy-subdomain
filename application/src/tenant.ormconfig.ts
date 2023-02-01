import { ormconfig } from './ormconfig';

import { join } from 'path';

export const tenantormconfig = {
  ...ormconfig,
  entities: [join(__dirname, './modules/tenanted/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/tenanted/*{.ts,.js}')],
};
