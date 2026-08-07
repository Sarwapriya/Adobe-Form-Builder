import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectCodeDateRange1800000000000 implements MigrationInterface {
  name = "AddProjectCodeDateRange1800000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ProjectCodes ADD startDate DATE NULL`);
    await queryRunner.query(`ALTER TABLE ProjectCodes ADD endDate DATE NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ProjectCodes DROP COLUMN startDate, endDate`);
  }
}
