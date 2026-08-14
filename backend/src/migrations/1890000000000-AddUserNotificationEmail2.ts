import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserNotificationEmail21890000000000 implements MigrationInterface {
  name = "AddUserNotificationEmail21890000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Users ADD notificationEmail2 NVARCHAR(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Users DROP COLUMN notificationEmail2`);
  }
}
