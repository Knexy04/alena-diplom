import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('manager', 'parent');
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "patronymic" VARCHAR(100),
        "phone" VARCHAR(20),
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "country" VARCHAR(100) NOT NULL,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "capacity" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "children" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "parent_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "patronymic" VARCHAR(100),
        "birth_date" DATE NOT NULL,
        "medical_notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "application_status_enum" AS ENUM ('review', 'processing', 'awaiting_payment', 'paid', 'completed');
    `);

    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "application_number" VARCHAR(20) UNIQUE NOT NULL,
        "parent_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "child_id" UUID NOT NULL REFERENCES "children"("id") ON DELETE CASCADE,
        "session_id" UUID NOT NULL REFERENCES "sessions"("id") ON DELETE CASCADE,
        "status" "application_status_enum" DEFAULT 'review',
        "notes" TEXT,
        "assigned_manager_id" UUID REFERENCES "users"("id"),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM ('contract', 'invoice', 'passport_scan', 'medical_certificate', 'other');
    `);

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "application_id" UUID NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
        "uploaded_by_id" UUID NOT NULL REFERENCES "users"("id"),
        "type" "document_type_enum" NOT NULL,
        "original_name" VARCHAR(255) NOT NULL,
        "file_path" VARCHAR(500) NOT NULL,
        "mime_type" VARCHAR(100) NOT NULL,
        "file_size" INTEGER NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "application_id" UUID NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
        "sender_id" UUID NOT NULL REFERENCES "users"("id"),
        "text" TEXT,
        "file_path" VARCHAR(500),
        "file_name" VARCHAR(255),
        "is_read" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM ('status_change', 'new_message', 'broadcast', 'document_uploaded');
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "type" "notification_type_enum" NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "body" TEXT NOT NULL,
        "is_read" BOOLEAN DEFAULT false,
        "related_application_id" UUID REFERENCES "applications"("id"),
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_children_parent" ON "children"("parent_id");`);
    await queryRunner.query(`CREATE INDEX "idx_applications_parent" ON "applications"("parent_id");`);
    await queryRunner.query(`CREATE INDEX "idx_applications_session" ON "applications"("session_id");`);
    await queryRunner.query(`CREATE INDEX "idx_applications_status" ON "applications"("status");`);
    await queryRunner.query(`CREATE INDEX "idx_messages_application" ON "messages"("application_id");`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");`);
    await queryRunner.query(`CREATE INDEX "idx_documents_application" ON "documents"("application_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "applications" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "children" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "document_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "application_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum";`);
  }
}
