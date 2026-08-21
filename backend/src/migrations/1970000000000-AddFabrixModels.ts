import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFabrixModels1970000000000 implements MigrationInterface {
  name = "AddFabrixModels1970000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE FabrixModels (
        id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name        NVARCHAR(100) NOT NULL,
        modelId     NVARCHAR(100) NOT NULL,
        isEnabled   BIT NOT NULL DEFAULT 1,
        sortOrder   INT NOT NULL DEFAULT 0,
        createdAt   DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    // Seeded from the admin-provided FabriX model catalog — several names are
    // deliberate aliases of the same underlying modelId (gpt-4o/gpt-4/
    // gpt-oss-120b(Mid)); request-building code dedupes by modelId so this is
    // harmless either way.
    await queryRunner.query(`
      INSERT INTO FabrixModels (name, modelId, isEnabled, sortOrder) VALUES
        ('Glm 5.2',                '019f23a1-46aa-7fa5-a6ab-391127fea7e6', 1, 0),
        ('Samsung LLM-Reasoning',  '01995a66-a919-7b3d-a589-e200de57555a', 1, 1),
        ('gpt-oss-120b(Mid)',      '019a774a-c6ad-7518-b37c-d651c2696c66', 1, 2),
        ('Gemma4',                 '019f238e-5c49-7bd2-b2fc-e500174936cf', 1, 3),
        ('gpt-oss-120b(Low)',      '01996fce-5f0e-7807-b8ae-aaca7532dc3e', 1, 4),
        ('Llama 3.3',              '01995a69-ab51-77a5-a6bd-364528f8d7a9', 1, 5),
        ('Samsung 2.3 37B',        '01992d20-4584-752b-a3aa-4d17612e8df9', 1, 6),
        ('gpt-4o',                 '019a774a-c6ad-7518-b37c-d651c2696c66', 1, 7),
        ('gpt-4',                  '019a774a-c6ad-7518-b37c-d651c2696c66', 1, 8)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE FabrixModels`);
  }
}
