import { MigrationInterface, QueryRunner } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export class firstMigration1676320259522 implements MigrationInterface {
    name = 'firstMigration1676320259522'

  public async up(queryRunner: QueryRunner): Promise<void> {
      
        const { schema } = queryRunner.connection
        .options as PostgresConnectionOptions;

        await queryRunner.query(`CREATE TABLE "${schema}"."role" ("name" character varying NOT NULL, CONSTRAINT "PK_${schema}_ae4578dcaed5adff96595e61660" PRIMARY KEY ("name"))`);
        await queryRunner.query(`CREATE TABLE "${schema}"."profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_${schema}_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "${schema}"."user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "username" character varying NOT NULL, "keycloakId" character varying NOT NULL, CONSTRAINT "PK_${schema}_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "${schema}"."profile_roles_role" ("profileId" uuid NOT NULL, "roleName" character varying NOT NULL, CONSTRAINT "PK_${schema}_22aad0e2158b3e879532b435845" PRIMARY KEY ("profileId", "roleName"))`);
        await queryRunner.query(`CREATE INDEX "IDX_${schema}_d3b61c78aded59b6c17379a870" ON "${schema}"."profile_roles_role" ("profileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_${schema}_edb80d0e18e840537868fc8ad0" ON "${schema}"."profile_roles_role" ("roleName") `);
        await queryRunner.query(`CREATE TABLE "${schema}"."user_profiles_profile" ("userId" uuid NOT NULL, "profileId" uuid NOT NULL, CONSTRAINT "PK_${schema}_3fd612037483bb43de64c850b0e" PRIMARY KEY ("userId", "profileId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_${schema}_f242c0b590e77b91136f23e40b" ON "${schema}"."user_profiles_profile" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_${schema}_39cce0bc4925eb8a93ac1420de" ON "${schema}"."user_profiles_profile" ("profileId") `);
        await queryRunner.query(`ALTER TABLE "${schema}"."profile_roles_role" ADD CONSTRAINT "FK_${schema}_d3b61c78aded59b6c17379a870b" FOREIGN KEY ("profileId") REFERENCES "${schema}"."profile"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "${schema}"."profile_roles_role" ADD CONSTRAINT "FK_${schema}_edb80d0e18e840537868fc8ad05" FOREIGN KEY ("roleName") REFERENCES "${schema}"."role"("name") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "${schema}"."user_profiles_profile" ADD CONSTRAINT "FK_${schema}_f242c0b590e77b91136f23e40bd" FOREIGN KEY ("userId") REFERENCES "${schema}"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "${schema}"."user_profiles_profile" ADD CONSTRAINT "FK_${schema}_39cce0bc4925eb8a93ac1420dee" FOREIGN KEY ("profileId") REFERENCES "${schema}"."profile"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

  public async down(queryRunner: QueryRunner): Promise<void> {
        const { schema } = queryRunner.connection
        .options as PostgresConnectionOptions;
        await queryRunner.query(`ALTER TABLE "${schema}"."user_profiles_profile" DROP CONSTRAINT "FK_${schema}_39cce0bc4925eb8a93ac1420dee"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."user_profiles_profile" DROP CONSTRAINT "FK_${schema}_f242c0b590e77b91136f23e40bd"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."profile_roles_role" DROP CONSTRAINT "FK_${schema}_edb80d0e18e840537868fc8ad05"`);
        await queryRunner.query(`ALTER TABLE "${schema}"."profile_roles_role" DROP CONSTRAINT "FK_${schema}_d3b61c78aded59b6c17379a870b"`);
        await queryRunner.query(`DROP INDEX "${schema}"."IDX_${schema}_39cce0bc4925eb8a93ac1420de"`);
        await queryRunner.query(`DROP INDEX "${schema}"."IDX_${schema}_f242c0b590e77b91136f23e40b"`);
        await queryRunner.query(`DROP TABLE "${schema}"."user_profiles_profile"`);
        await queryRunner.query(`DROP INDEX "${schema}"."IDX_${schema}_edb80d0e18e840537868fc8ad0"`);
        await queryRunner.query(`DROP INDEX "${schema}"."IDX_${schema}_d3b61c78aded59b6c17379a870"`);
        await queryRunner.query(`DROP TABLE "${schema}"."profile_roles_role"`);
        await queryRunner.query(`DROP TABLE "${schema}"."user"`);
        await queryRunner.query(`DROP TABLE "${schema}"."profile"`);
        await queryRunner.query(`DROP TABLE "${schema}"."role"`);
    }

}
