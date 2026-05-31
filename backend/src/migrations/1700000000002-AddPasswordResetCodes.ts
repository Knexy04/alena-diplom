import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetCodes1700000000002 implements MigrationInterface {
  name = 'AddPasswordResetCodes1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_codes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "code_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_codes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_codes_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_codes_user_id" ON "password_reset_codes" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_password_reset_codes_user_id"`);
    await queryRunner.query(`DROP TABLE "password_reset_codes"`);
  }
}
