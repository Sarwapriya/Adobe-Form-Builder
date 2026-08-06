import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubsidiaryIsActive1780000000000 implements MigrationInterface {
  name = "AddSubsidiaryIsActive1780000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Subsidiaries ADD isActive BIT NOT NULL DEFAULT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Subsidiaries DROP COLUMN isActive`);
  }
}
