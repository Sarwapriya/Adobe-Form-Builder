import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectCodeCutoffDate1860000000000 implements MigrationInterface {
  name = "AddProjectCodeCutoffDate1860000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ProjectCodes ADD cutoffDate DATE NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ProjectCodes DROP COLUMN cutoffDate`);
  }
}
