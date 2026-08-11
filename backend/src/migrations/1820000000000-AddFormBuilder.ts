import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormBuilder1820000000000 implements MigrationInterface {
  name = "AddFormBuilder1820000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Forms (
        id                   UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name                 NVARCHAR(200) NOT NULL,
        subsidiaryId         NVARCHAR(50) NOT NULL,
        projectCode          NVARCHAR(100) NULL,
        status               NVARCHAR(20) NOT NULL DEFAULT 'draft',
        currentDraftVersionId UNIQUEIDENTIFIER NULL,
        publishedVersionId    UNIQUEIDENTIFIER NULL,
        isDeleted            BIT NOT NULL DEFAULT 0,
        createdByUserId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
        createdAt            DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
        updatedAt            DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE FormVersions (
        id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        formId           UNIQUEIDENTIFIER NOT NULL REFERENCES Forms(id),
        versionNumber    INT NULL,
        definition       NVARCHAR(MAX) NOT NULL,
        config           NVARCHAR(MAX) NOT NULL,
        status           NVARCHAR(20) NOT NULL DEFAULT 'draft',
        createdByUserId  UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
        createdAt        DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
        publishedAt      DATETIMEOFFSET(7) NULL,
        unpublishedAt    DATETIMEOFFSET(7) NULL
      )
    `);

    await queryRunner.query(`
      ALTER TABLE Forms ADD CONSTRAINT FK_Forms_currentDraftVersionId
        FOREIGN KEY (currentDraftVersionId) REFERENCES FormVersions(id)
    `);
    await queryRunner.query(`
      ALTER TABLE Forms ADD CONSTRAINT FK_Forms_publishedVersionId
        FOREIGN KEY (publishedVersionId) REFERENCES FormVersions(id)
    `);

    await queryRunner.query(`CREATE INDEX IX_FormVersions_formId ON FormVersions(formId)`);
    await queryRunner.query(`CREATE INDEX IX_Forms_subsidiaryId ON Forms(subsidiaryId)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Forms DROP CONSTRAINT FK_Forms_publishedVersionId`);
    await queryRunner.query(`ALTER TABLE Forms DROP CONSTRAINT FK_Forms_currentDraftVersionId`);
    await queryRunner.query(`DROP TABLE FormVersions`);
    await queryRunner.query(`DROP TABLE Forms`);
  }
}
