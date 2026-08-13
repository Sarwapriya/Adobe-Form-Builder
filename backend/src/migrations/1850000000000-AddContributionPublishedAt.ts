import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContributionPublishedAt1850000000000 implements MigrationInterface {
  name = "AddContributionPublishedAt1850000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE FormContributions ADD publishedAt DATETIMEOFFSET(7) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE FormContributions DROP COLUMN publishedAt`);
  }
}
