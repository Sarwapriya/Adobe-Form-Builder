import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionMasterVersions1900000000000 implements MigrationInterface {
  name = "AddQuestionMasterVersions1900000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE QuestionMasterVersions (
          id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          projectCode       NVARCHAR(100) NOT NULL,
          version           INT NOT NULL,
          division          NVARCHAR(50) NOT NULL DEFAULT '',
          filePath          NVARCHAR(500) NOT NULL,
          subsidiaryCount   INT NOT NULL DEFAULT 0,
          totalRows         INT NOT NULL DEFAULT 0,
          generatedByUserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
          generatedAt       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_QuestionMasterVersions_projectCode_version ON QuestionMasterVersions(projectCode, version)`,
    );
    await queryRunner.query(`CREATE INDEX IX_QuestionMasterVersions_projectCode ON QuestionMasterVersions(projectCode)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE QuestionMasterVersions`);
  }
}
