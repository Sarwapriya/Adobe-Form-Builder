import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionOverrides1740000000000 implements MigrationInterface {
  name = "AddQuestionOverrides1740000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // JSON-encoded Record<questionId, boolean> — which questions the uploader
    // marked optional at upload time, re-applied on regeneration. See
    // generationService.generateFromWorkbook's requiredOverrides param.
    await queryRunner.query(`ALTER TABLE Uploads ADD questionOverrides NVARCHAR(MAX) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Uploads DROP COLUMN questionOverrides`);
  }
}
