import { DataSource } from 'typeorm';
import { tenantormconfig } from '../../tenant.ormconfig';

export async function getTenantConnection(
  subdomain: string,
): Promise<DataSource> {
  console.log('usando conexao de tenant');
  const schema = `tenant_${subdomain.toLowerCase()}`;

  return new DataSource({
    ...tenantormconfig,
    schema: schema,
  }).initialize();
}
