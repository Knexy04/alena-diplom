import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationAttachment1700000000001 implements MigrationInterface {
  name = 'AddNotificationAttachment1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN "file_path" VARCHAR(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN "file_name" VARCHAR(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "file_name"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "file_path"`);
  }
}
