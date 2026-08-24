import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Renames ClaudeModels (added by AddClaudeModels1980000000000) to
 * OtherAiModels — table/entity naming brought in line with the rest of the
 * "Other AI Providers" admin section (see OtherAiModel.ts), which stays
 * provider-generic rather than naming Claude outright even though it's the
 * only fallback provider actually wired up server-side today. Data (the 8
 * seeded model rows) is preserved — this is a pure rename, not a
 * drop/recreate.
 */
export class RenameClaudeModelsToOtherAiModels1990000000000 implements MigrationInterface {
  name = "RenameClaudeModelsToOtherAiModels1990000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`EXEC sp_rename 'ClaudeModels', 'OtherAiModels'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`EXEC sp_rename 'OtherAiModels', 'ClaudeModels'`);
  }
}
