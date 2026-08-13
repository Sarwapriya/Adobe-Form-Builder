import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormContributions1840000000000 implements MigrationInterface {
  name = "AddFormContributions1840000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE FormContributions (
        id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        formId             UNIQUEIDENTIFIER NOT NULL REFERENCES Forms(id),
        submittedByUserId  UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
        baseVersionId      UNIQUEIDENTIFIER NULL REFERENCES FormVersions(id),
        status             NVARCHAR(20) NOT NULL DEFAULT 'pending',
        content            NVARCHAR(MAX) NOT NULL,
        note               NVARCHAR(MAX) NULL,
        reviewNote         NVARCHAR(MAX) NULL,
        reviewedByUserId   UNIQUEIDENTIFIER NULL REFERENCES Users(id),
        submittedAt        DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
        reviewedAt         DATETIMEOFFSET(7) NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX IX_FormContributions_formId ON FormContributions(formId)`);
    await queryRunner.query(`CREATE INDEX IX_FormContributions_submittedByUserId ON FormContributions(submittedByUserId)`);
    await queryRunner.query(`CREATE INDEX IX_FormContributions_status ON FormContributions(status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE FormContributions`);
  }
}
