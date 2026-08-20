import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionMasterSource1940000000000 implements MigrationInterface {
  name = "AddQuestionMasterSource1940000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Every existing row was produced by the original Form-Initiator-based process,
    // hence the 'form_builder' default — this migration is purely additive and
    // doesn't change what any pre-existing version means.
    await queryRunner.query(`ALTER TABLE QuestionMasterVersions ADD source NVARCHAR(20) NOT NULL DEFAULT 'form_builder'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE QuestionMasterVersions DROP COLUMN source`);
  }
}
