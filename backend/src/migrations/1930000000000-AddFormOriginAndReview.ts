import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormOriginAndReview1930000000000 implements MigrationInterface {
  name = "AddFormOriginAndReview1930000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Forms ADD origin NVARCHAR(10) NOT NULL DEFAULT 'admin'`);
    await queryRunner.query(`ALTER TABLE Forms ADD pendingReview BIT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE Forms ADD submittedForReviewAt DATETIMEOFFSET(7) NULL`);
    await queryRunner.query(`ALTER TABLE Forms ADD reviewedAt DATETIMEOFFSET(7) NULL`);
    await queryRunner.query(`ALTER TABLE Forms ADD reviewNote NVARCHAR(2000) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Forms DROP COLUMN reviewNote`);
    await queryRunner.query(`ALTER TABLE Forms DROP COLUMN reviewedAt`);
    await queryRunner.query(`ALTER TABLE Forms DROP COLUMN submittedForReviewAt`);
    await queryRunner.query(`ALTER TABLE Forms DROP COLUMN pendingReview`);
    await queryRunner.query(`ALTER TABLE Forms DROP COLUMN origin`);
  }
}
