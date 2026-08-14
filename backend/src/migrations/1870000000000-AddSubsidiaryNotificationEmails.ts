import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubsidiaryNotificationEmails1870000000000 implements MigrationInterface {
  name = "AddSubsidiaryNotificationEmails1870000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Subsidiaries ADD notificationEmail1 NVARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE Subsidiaries ADD notificationEmail2 NVARCHAR(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Subsidiaries DROP COLUMN notificationEmail1`);
    await queryRunner.query(`ALTER TABLE Subsidiaries DROP COLUMN notificationEmail2`);
  }
}
