import { MigrationInterface, QueryRunner } from "typeorm";

export class firstMigration1675717167059 implements MigrationInterface {
    name = 'firstMigration1675717167059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant" ADD "parentId" uuid`);
        await queryRunner.query(`ALTER TABLE "tenant" ADD CONSTRAINT "FK_84d4aa3a39237c02416498d0408" FOREIGN KEY ("parentId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant" DROP CONSTRAINT "FK_84d4aa3a39237c02416498d0408"`);
        await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "parentId"`);
        await queryRunner.query(`ALTER TABLE "tenant" DROP COLUMN "name"`);
    }

}
