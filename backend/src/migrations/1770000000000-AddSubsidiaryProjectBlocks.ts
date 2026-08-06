import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubsidiaryProjectBlocks1770000000000 implements MigrationInterface {
  name = "AddSubsidiaryProjectBlocks1770000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE SubsidiaryProjectBlocks (
          id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          subsidiaryName NVARCHAR(100) NOT NULL,
          projectCode    NVARCHAR(100) NOT NULL,
          createdAt      DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_SubsidiaryProjectBlocks_pair ON SubsidiaryProjectBlocks(subsidiaryName, projectCode)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE SubsidiaryProjectBlocks`);
  }
}
