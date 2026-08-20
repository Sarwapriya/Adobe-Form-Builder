import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiAssistant1950000000000 implements MigrationInterface {
  name = "AddAiAssistant1950000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE AIConversations (
        id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        userId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
        formId      UNIQUEIDENTIFIER NULL REFERENCES Forms(id),
        title       NVARCHAR(200) NULL,
        status      NVARCHAR(20) NOT NULL DEFAULT 'active',
        createdAt   DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET(),
        updatedAt   DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE AIConversationMessages (
        id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        conversationId  UNIQUEIDENTIFIER NOT NULL REFERENCES AIConversations(id),
        role            NVARCHAR(20) NOT NULL,
        message         NVARCHAR(MAX) NOT NULL,
        tokenUsage      INT NULL,
        model           NVARCHAR(100) NULL,
        requestId       NVARCHAR(100) NULL,
        createdAt       DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE AIActions (
        id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        conversationId    UNIQUEIDENTIFIER NOT NULL REFERENCES AIConversations(id),
        formId            UNIQUEIDENTIFIER NULL REFERENCES Forms(id),
        userId            UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
        actionType        NVARCHAR(50) NOT NULL,
        requestJson       NVARCHAR(MAX) NOT NULL,
        responseJson      NVARCHAR(MAX) NULL,
        confirmed         BIT NOT NULL DEFAULT 0,
        executed          BIT NOT NULL DEFAULT 0,
        executionResult   NVARCHAR(MAX) NULL,
        createdAt         DATETIMEOFFSET(7) DEFAULT SYSDATETIMEOFFSET()
      )
    `);

    await queryRunner.query(`CREATE INDEX IX_AIConversations_userId ON AIConversations(userId)`);
    await queryRunner.query(`CREATE INDEX IX_AIConversationMessages_conversationId ON AIConversationMessages(conversationId)`);
    await queryRunner.query(`CREATE INDEX IX_AIActions_conversationId ON AIActions(conversationId)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE AIActions`);
    await queryRunner.query(`DROP TABLE AIConversationMessages`);
    await queryRunner.query(`DROP TABLE AIConversations`);
  }
}
