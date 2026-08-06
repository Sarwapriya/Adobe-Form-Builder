import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubsidiaries1760000000000 implements MigrationInterface {
  name = "AddSubsidiaries1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Subsidiaries (
          id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          name      NVARCHAR(100) NOT NULL UNIQUE,
          createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE Subsidiaries`);
  }
}
