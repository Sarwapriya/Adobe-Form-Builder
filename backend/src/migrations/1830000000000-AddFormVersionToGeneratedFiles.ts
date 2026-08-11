import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormVersionToGeneratedFiles1830000000000 implements MigrationInterface {
  name = "AddFormVersionToGeneratedFiles1830000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Relaxing nullability doesn't require touching uploadId's existing FK
    // constraint (SQL Server allows ALTER COLUMN nullability changes with an FK
    // in place) — the CHECK constraint added below is what actually guarantees
    // exactly one owner (uploadId xor formVersionId) is ever set.
    await queryRunner.query(`ALTER TABLE GeneratedFiles ALTER COLUMN uploadId UNIQUEIDENTIFIER NULL`);
    // Named explicitly (not inline REFERENCES, which SQL Server would auto-name
    // unpredictably) so down() can drop it by name before dropping the column —
    // discovered the hard way: an unnamed FK blocks ALTER TABLE ... DROP COLUMN.
    await queryRunner.query(`ALTER TABLE GeneratedFiles ADD formVersionId UNIQUEIDENTIFIER NULL`);
    await queryRunner.query(`
      ALTER TABLE GeneratedFiles ADD CONSTRAINT FK_GeneratedFiles_formVersionId
        FOREIGN KEY (formVersionId) REFERENCES FormVersions(id)
    `);
    await queryRunner.query(`
      ALTER TABLE GeneratedFiles ADD CONSTRAINT CK_GeneratedFiles_owner
        CHECK ((uploadId IS NOT NULL AND formVersionId IS NULL) OR (uploadId IS NULL AND formVersionId IS NOT NULL))
    `);
    await queryRunner.query(`CREATE INDEX IX_GeneratedFiles_formVersionId ON GeneratedFiles(formVersionId)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IX_GeneratedFiles_formVersionId ON GeneratedFiles`);
    await queryRunner.query(`ALTER TABLE GeneratedFiles DROP CONSTRAINT CK_GeneratedFiles_owner`);
    await queryRunner.query(`ALTER TABLE GeneratedFiles DROP CONSTRAINT FK_GeneratedFiles_formVersionId`);
    await queryRunner.query(`ALTER TABLE GeneratedFiles DROP COLUMN formVersionId`);
    // IX_GeneratedFiles_uploadId (from InitSchema) depends on uploadId, same
    // dependency problem as the FK above — drop and recreate it around the
    // ALTER COLUMN rather than leaving the column permanently un-indexed.
    await queryRunner.query(`DROP INDEX IX_GeneratedFiles_uploadId ON GeneratedFiles`);
    await queryRunner.query(`ALTER TABLE GeneratedFiles ALTER COLUMN uploadId UNIQUEIDENTIFIER NOT NULL`);
    await queryRunner.query(`CREATE INDEX IX_GeneratedFiles_uploadId ON GeneratedFiles(uploadId)`);
  }
}
