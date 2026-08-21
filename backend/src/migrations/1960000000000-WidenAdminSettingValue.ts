import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * AdminSettings.value was NVARCHAR(255) — fine for the settings this table
 * originally held (a URL, a flag, an email address), but too small for an
 * encrypted FABRIX_OPENAPI_TOKEN (some FabriXAI deployments issue several-
 * hundred-character signed JWTs as this value, which grow further once
 * AES-256-GCM-encrypted and base64-encoded — see fabrixSettingsService.ts).
 * Widened to NVARCHAR(MAX) rather than picking a new fixed cap, matching how
 * every other genuinely large text column in this schema (FormVersion.
 * definition, FormContribution.content, etc.) is already MAX rather than a
 * guessed length.
 */
export class WidenAdminSettingValue1960000000000 implements MigrationInterface {
  name = "WidenAdminSettingValue1960000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE AdminSettings ALTER COLUMN value NVARCHAR(MAX) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE AdminSettings ALTER COLUMN value NVARCHAR(255) NOT NULL`);
  }
}
