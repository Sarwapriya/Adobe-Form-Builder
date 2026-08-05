import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectCodes1730000000000 implements MigrationInterface {
  name = "AddProjectCodes1730000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ProjectCodes (
          id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          code      NVARCHAR(100) NOT NULL UNIQUE,
          isOpen    BIT NOT NULL DEFAULT 1,
          createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    // Text snapshot, not a foreign key — mirrors Uploads.subsidiaryId, so no
    // join is needed anywhere Uploads is already listed/filtered/displayed.
    await queryRunner.query(`ALTER TABLE Uploads ADD projectCode NVARCHAR(100) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Uploads DROP COLUMN projectCode`);
    await queryRunner.query(`DROP TABLE ProjectCodes`);
  }
}
