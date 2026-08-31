import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserFirstLastName2010000000000 implements MigrationInterface {
  name = "AddUserFirstLastName2010000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Users ADD firstName NVARCHAR(100) NULL`);
    await queryRunner.query(`ALTER TABLE Users ADD lastName NVARCHAR(100) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Users DROP COLUMN lastName`);
    await queryRunner.query(`ALTER TABLE Users DROP COLUMN firstName`);
  }
}
