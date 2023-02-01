import { Connection, createConnection, getConnectionManager } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { tenantormconfig } from '../../tenant.ormconfig';

export function getTenantConnection(subdomain: string): Promise<Connection> {
  console.log('usando conexao de tenant');
  const connectionName = `tenant_${subdomain}`;
  const connectionManager = getConnectionManager();

  if (connectionManager.has(connectionName)) {
    const connection = connectionManager.get(connectionName);
    return Promise.resolve(
      connection.isConnected ? connection : connection.connect(),
    );
  }

  return createConnection({
    ...tenantormconfig,
    name: connectionName,
    schema: connectionName,
  } as PostgresConnectionOptions);
}
