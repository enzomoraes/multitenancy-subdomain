import { Role } from 'src/modules/tenanted/roles/entities/role.entity';
import _roles from 'src/_roles';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class firstMigration1676465373527 implements MigrationInterface {
  name = 'firstMigration1676465373527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(
      `CREATE TABLE "${schema}"."role" ("name" character varying NOT NULL, CONSTRAINT "PK_${schema}_ae4578dcaed5adff96595e61660" PRIMARY KEY ("name"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${schema}"."user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "username" character varying NOT NULL, "keycloakId" character varying NOT NULL, CONSTRAINT "PK_${schema}_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    // inserting roles
    for (const role of _roles) {
      await queryRunner.manager.save<Role>(
        queryRunner.manager.create<Role>(Role, { name: role.name }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { schema } = queryRunner.connection
      .options as PostgresConnectionOptions;
    await queryRunner.query(`DROP TABLE "${schema}"."user"`);
    await queryRunner.query(`DROP TABLE "${schema}"."role"`);
  }
}
