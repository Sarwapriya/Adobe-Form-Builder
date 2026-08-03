import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1700000000000 implements MigrationInterface {
  name = "InitSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Uploads (
          id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          subsidiaryId     NVARCHAR(50) NOT NULL,
          fileName         NVARCHAR(255) NOT NULL,
          filePath         NVARCHAR(2000) NOT NULL,
          uploadDate       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
          submissionCount INT DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE TABLE AdminSettings (
          [key]   NVARCHAR(50) PRIMARY KEY,
          value   NVARCHAR(255) NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE AdminSettings`);
    await queryRunner.query(`DROP TABLE Uploads`);
  }
}
