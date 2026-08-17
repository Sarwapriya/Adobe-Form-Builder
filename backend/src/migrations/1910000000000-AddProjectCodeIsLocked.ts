import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectCodeIsLocked1910000000000 implements MigrationInterface {
  name = "AddProjectCodeIsLocked1910000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ProjectCodes ADD isLocked BIT NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ProjectCodes DROP COLUMN isLocked`);
  }
}
