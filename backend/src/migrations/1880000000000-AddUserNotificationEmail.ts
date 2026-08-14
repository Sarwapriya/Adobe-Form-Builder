import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserNotificationEmail1880000000000 implements MigrationInterface {
  name = "AddUserNotificationEmail1880000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Users ADD notificationEmail NVARCHAR(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Users DROP COLUMN notificationEmail`);
  }
}
