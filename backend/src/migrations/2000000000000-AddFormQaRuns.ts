import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormQaRuns2000000000000 implements MigrationInterface {
  name = "AddFormQaRuns2000000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Same "relax nullability with the FK left in place" approach as
    // AddFormVersionToGeneratedFiles used for GeneratedFiles.uploadId — SQL
    // Server allows this without touching the (unnamed, auto-generated) FK.
    await queryRunner.query(`ALTER TABLE QaRuns ALTER COLUMN uploadId UNIQUEIDENTIFIER NULL`);

    await queryRunner.query(`ALTER TABLE QaRuns ADD formId UNIQUEIDENTIFIER NULL`);
    await queryRunner.query(`ALTER TABLE QaRuns ADD contributionId UNIQUEIDENTIFIER NULL`);
    await queryRunner.query(`
      ALTER TABLE QaRuns ADD CONSTRAINT FK_QaRuns_formId
        FOREIGN KEY (formId) REFERENCES Forms(id)
    `);
    await queryRunner.query(`
      ALTER TABLE QaRuns ADD CONSTRAINT FK_QaRuns_contributionId
        FOREIGN KEY (contributionId) REFERENCES FormContributions(id)
    `);
    // Exactly one subject (uploadId xor formId) — contributionId is optional
    // even when formId is set (null for an ad-hoc pending-review run, which
    // has no separate FormContribution row; set for a Translate & Extend
    // contribution run) — same "owner" convention as GeneratedFiles.
    await queryRunner.query(`
      ALTER TABLE QaRuns ADD CONSTRAINT CK_QaRuns_owner
        CHECK ((uploadId IS NOT NULL AND formId IS NULL) OR (uploadId IS NULL AND formId IS NOT NULL))
    `);
    await queryRunner.query(`CREATE INDEX IX_QaRuns_formId ON QaRuns(formId)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IX_QaRuns_formId ON QaRuns`);
    await queryRunner.query(`ALTER TABLE QaRuns DROP CONSTRAINT CK_QaRuns_owner`);
    await queryRunner.query(`ALTER TABLE QaRuns DROP CONSTRAINT FK_QaRuns_contributionId`);
    await queryRunner.query(`ALTER TABLE QaRuns DROP CONSTRAINT FK_QaRuns_formId`);
    await queryRunner.query(`ALTER TABLE QaRuns DROP COLUMN contributionId`);
    await queryRunner.query(`ALTER TABLE QaRuns DROP COLUMN formId`);
    await queryRunner.query(`DROP INDEX IX_QaRuns_uploadId ON QaRuns`);
    await queryRunner.query(`ALTER TABLE QaRuns ALTER COLUMN uploadId UNIQUEIDENTIFIER NOT NULL`);
    await queryRunner.query(`CREATE INDEX IX_QaRuns_uploadId ON QaRuns(uploadId)`);
  }
}
