import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUploadVariants1810000000000 implements MigrationInterface {
  name = "AddUploadVariants1810000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Uploads ADD variants NVARCHAR(50) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Uploads DROP COLUMN variants`);
  }
}
