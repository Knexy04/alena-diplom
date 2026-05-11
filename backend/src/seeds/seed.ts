import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../config/database.config';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  console.log('Подключение к БД установлено');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Очистка всех тестовых данных
    await queryRunner.query('DELETE FROM "notifications"');
    await queryRunner.query('DELETE FROM "messages"');
    await queryRunner.query('DELETE FROM "documents"');
    await queryRunner.query('DELETE FROM "applications"');
    await queryRunner.query('DELETE FROM "children"');
    await queryRunner.query('DELETE FROM "sessions"');
    await queryRunner.query('DELETE FROM "users"');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Менеджеры — единственные пользователи в системе
    await queryRunner.query(
      `INSERT INTO "users" (email, password_hash, role, first_name, last_name, patronymic, phone)
       VALUES ($1, $2, 'manager', 'Админ', 'Администратов', 'Админович', '+7 900 000-00-01')`,
      ['admin@juniorcamp.ru', passwordHash],
    );

    await queryRunner.query(
      `INSERT INTO "users" (email, password_hash, role, first_name, last_name, patronymic, phone)
       VALUES ($1, $2, 'manager', 'Алёна', 'Чередниченко', NULL, '+7 900 000-00-02')`,
      ['manager@juniorcamp.ru', passwordHash],
    );

    console.log('Пользователи созданы');
    console.log('✅ Seed завершён успешно!');
  } catch (error) {
    console.error('Ошибка при заполнении данных:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
