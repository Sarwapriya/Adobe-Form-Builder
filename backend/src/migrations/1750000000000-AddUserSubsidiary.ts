import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSubsidiary1750000000000 implements MigrationInterface {
  name = "AddUserSubsidiary1750000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Scopes a standard user to one subsidiary — null for admins and for
    // standard users not tied to one. See upload.router.ts/uploadService.ts,
    // which use this to auto-fill/lock and to override the upload form's
    // Subsidiary field server-side.
    await queryRunner.query(`ALTER TABLE Users ADD subsidiaryId NVARCHAR(50) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Users DROP COLUMN subsidiaryId`);
  }
}
