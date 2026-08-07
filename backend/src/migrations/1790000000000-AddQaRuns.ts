import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQaRuns1790000000000 implements MigrationInterface {
  name = "AddQaRuns1790000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE QaRuns (
          id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          uploadId          UNIQUEIDENTIFIER NOT NULL REFERENCES Uploads(id),
          variant           NVARCHAR(10) NOT NULL,
          status            NVARCHAR(20) NOT NULL DEFAULT 'pending',
          triggeredByUserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
          totalTests        INT NOT NULL DEFAULT 0,
          passedTests       INT NOT NULL DEFAULT 0,
          failedTests       INT NOT NULL DEFAULT 0,
          errorMessage      NVARCHAR(MAX) NULL,
          reportPath        NVARCHAR(2000) NULL,
          createdAt         DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
          startedAt         DATETIMEOFFSET(7) NULL,
          completedAt       DATETIMEOFFSET(7) NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX IX_QaRuns_uploadId ON QaRuns(uploadId)`);

    await queryRunner.query(`
      CREATE TABLE QaTestCaseResults (
          id        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          qaRunId   UNIQUEIDENTIFIER NOT NULL REFERENCES QaRuns(id),
          category  NVARCHAR(40) NOT NULL,
          name      NVARCHAR(255) NOT NULL,
          status    NVARCHAR(10) NOT NULL,
          fieldId   NVARCHAR(100) NULL,
          message   NVARCHAR(2000) NULL,
          createdAt DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`CREATE INDEX IX_QaTestCaseResults_qaRunId ON QaTestCaseResults(qaRunId)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE QaTestCaseResults`);
    await queryRunner.query(`DROP TABLE QaRuns`);
  }
}
