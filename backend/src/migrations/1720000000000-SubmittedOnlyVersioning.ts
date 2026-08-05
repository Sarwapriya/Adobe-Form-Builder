import { MigrationInterface, QueryRunner } from "typeorm";

export class SubmittedOnlyVersioning1720000000000 implements MigrationInterface {
  name = "SubmittedOnlyVersioning1720000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Version numbers are now only meaningful for submitted uploads (assigned
    // by submissionService.ts at submit time, scoped to prior submissions for
    // the same subsidiary) — an in-progress or failed upload has no version at
    // all, rather than consuming one from the same shared counter.
    await queryRunner.query(`ALTER TABLE Uploads DROP CONSTRAINT UQ_Uploads_subsidiary_version`);
    await queryRunner.query(`ALTER TABLE Uploads ALTER COLUMN version INT NULL`);
    await queryRunner.query(`UPDATE Uploads SET version = NULL WHERE status <> 'submitted'`);
    // A filtered unique index (rather than a table CONSTRAINT, which SQL
    // Server would treat as a single shared NULL slot) so any number of
    // not-yet-submitted uploads with a NULL version can coexist per
    // subsidiary — only actual version numbers must stay unique.
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_Uploads_subsidiary_version ON Uploads(subsidiaryId, version) WHERE version IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX UQ_Uploads_subsidiary_version ON Uploads`);
    // Lossy best-effort revert: collapses every not-yet-submitted upload back
    // to version 1, which will collide (and fail the constraint below) if a
    // subsidiary has more than one. Acceptable for a down-migration, which
    // exists as an escape hatch, not a guaranteed round-trip.
    await queryRunner.query(`UPDATE Uploads SET version = 1 WHERE version IS NULL`);
    await queryRunner.query(`ALTER TABLE Uploads ALTER COLUMN version INT NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE Uploads ADD CONSTRAINT UQ_Uploads_subsidiary_version UNIQUE (subsidiaryId, version)
    `);
  }
}
