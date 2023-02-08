import { MigrationInterface, QueryRunner } from "typeorm";

export class firstMigration1675881894871 implements MigrationInterface {
    name = 'firstMigration1675881894871'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "subdomain" character varying NOT NULL, "name" character varying NOT NULL, "parentId" uuid, CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tenant" ADD CONSTRAINT "FK_84d4aa3a39237c02416498d0408" FOREIGN KEY ("parentId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant" DROP CONSTRAINT "FK_84d4aa3a39237c02416498d0408"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
    }

}
