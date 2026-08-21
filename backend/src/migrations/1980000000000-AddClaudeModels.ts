import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClaudeModels1980000000000 implements MigrationInterface {
  name = "AddClaudeModels1980000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ClaudeModels (
        id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name        NVARCHAR(100) NOT NULL,
        modelId     NVARCHAR(100) NOT NULL,
        sortOrder   INT NOT NULL DEFAULT 0,
        createdAt   DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    // Seeded from Anthropic's current model lineup (cached 2026-06-24) —
    // excludes claude-mythos-5 (Project Glasswing invitation-only, not
    // generally available). The Model field in the admin UI stays free-text
    // capable, so a model id newer than this list still works.
    await queryRunner.query(`
      INSERT INTO ClaudeModels (name, modelId, sortOrder) VALUES
        ('Claude Fable 5',    'claude-fable-5',    0),
        ('Claude Opus 5',     'claude-opus-5',     1),
        ('Claude Opus 4.8',   'claude-opus-4-8',   2),
        ('Claude Opus 4.7',   'claude-opus-4-7',   3),
        ('Claude Opus 4.6',   'claude-opus-4-6',   4),
        ('Claude Sonnet 5',   'claude-sonnet-5',   5),
        ('Claude Sonnet 4.6', 'claude-sonnet-4-6', 6),
        ('Claude Haiku 4.5',  'claude-haiku-4-5',  7)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ClaudeModels`);
  }
}
