import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubsidiaryLocales1920000000000 implements MigrationInterface {
  name = "AddSubsidiaryLocales1920000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE SubsidiaryLocales (
          id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          subsidiaryName NVARCHAR(100) NOT NULL,
          code           NVARCHAR(20) NOT NULL,
          langSubtag     NVARCHAR(10) NOT NULL,
          isRtl          BIT NOT NULL,
          label          NVARCHAR(100) NOT NULL,
          isFallback     BIT NOT NULL DEFAULT 0,
          sortOrder      INT NOT NULL DEFAULT 0,
          createdAt      DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_SubsidiaryLocales_pair ON SubsidiaryLocales(subsidiaryName, code)
    `);

    // Seed the initial per-subsidiary master locale list (first listed = fallback).
    await queryRunner.query(`
      INSERT INTO SubsidiaryLocales (subsidiaryName, code, langSubtag, isRtl, label, isFallback, sortOrder) VALUES
        ('SGE',   'en_AE', 'en', 0, 'English', 1, 0),
        ('SGE',   'ar_AE', 'ar', 1, 'Arabic',  0, 1),

        ('SETK',  'tr_TR', 'tr', 0, 'Turkish', 1, 0),

        ('SEMAG', 'fr_MA', 'fr', 0, 'French',  1, 0),

        ('IRAN',  'fa_IR', 'fa', 1, 'Persian', 1, 0),

        ('SEEG',  'ar_EG', 'ar', 1, 'Arabic',  1, 0),
        ('SEEG',  'en_EG', 'en', 0, 'English', 0, 1),

        ('SEIL',  'he_IL', 'he', 1, 'Hebrew',  1, 0),
        ('SEIL',  'ar_PS', 'ar', 1, 'Arabic',  0, 1),

        ('SELV',  'en_JO', 'en', 0, 'English', 1, 0),
        ('SELV',  'en_LB', 'en', 0, 'English', 0, 1),
        ('SELV',  'ar_IQ', 'ar', 1, 'Arabic',  0, 2),
        ('SELV',  'ku_IQ', 'ku', 1, 'Kurdish', 0, 3),

        ('SEPAK', 'en_PK', 'en', 0, 'English', 1, 0),

        ('SESAR', 'en_SA', 'en', 0, 'English', 1, 0),
        ('SESAR', 'ar_SA', 'ar', 1, 'Arabic',  0, 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE SubsidiaryLocales`);
  }
}
