import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../config/database.config';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  console.log('Подключение к БД установлено');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // Очистка таблиц
    await queryRunner.query('DELETE FROM "notifications"');
    await queryRunner.query('DELETE FROM "messages"');
    await queryRunner.query('DELETE FROM "documents"');
    await queryRunner.query('DELETE FROM "applications"');
    await queryRunner.query('DELETE FROM "children"');
    await queryRunner.query('DELETE FROM "sessions"');
    await queryRunner.query('DELETE FROM "users"');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Менеджеры
    const [admin] = await queryRunner.query(
      `INSERT INTO "users" (email, password_hash, role, first_name, last_name, patronymic, phone)
       VALUES ($1, $2, 'manager', 'Админ', 'Администратов', 'Админович', '+7 900 000-00-01')
       RETURNING id`,
      ['admin@juniorcamp.ru', passwordHash],
    );

    const [manager] = await queryRunner.query(
      `INSERT INTO "users" (email, password_hash, role, first_name, last_name, patronymic, phone)
       VALUES ($1, $2, 'manager', 'Мария', 'Менеджерова', 'Ивановна', '+7 900 000-00-02')
       RETURNING id`,
      ['manager@juniorcamp.ru', passwordHash],
    );

    // Родители
    const [ivanov] = await queryRunner.query(
      `INSERT INTO "users" (email, password_hash, role, first_name, last_name, patronymic, phone)
       VALUES ($1, $2, 'parent', 'Иван', 'Иванов', 'Петрович', '+7 999 111-11-11')
       RETURNING id`,
      ['ivanov@mail.ru', passwordHash],
    );

    const [petrova] = await queryRunner.query(
      `INSERT INTO "users" (email, password_hash, role, first_name, last_name, patronymic, phone)
       VALUES ($1, $2, 'parent', 'Елена', 'Петрова', 'Сергеевна', '+7 999 222-22-22')
       RETURNING id`,
      ['petrova@mail.ru', passwordHash],
    );

    const [sidorov] = await queryRunner.query(
      `INSERT INTO "users" (email, password_hash, role, first_name, last_name, patronymic, phone)
       VALUES ($1, $2, 'parent', 'Алексей', 'Сидоров', 'Николаевич', '+7 999 333-33-33')
       RETURNING id`,
      ['sidorov@mail.ru', passwordHash],
    );

    console.log('Пользователи созданы');

    // Смены
    const [session1] = await queryRunner.query(
      `INSERT INTO "sessions" (title, country, start_date, end_date, capacity, price)
       VALUES ('1-я смена — Кипр', 'Кипр', '2025-07-01', '2025-07-14', 30, 85000)
       RETURNING id`,
    );

    const [session2] = await queryRunner.query(
      `INSERT INTO "sessions" (title, country, start_date, end_date, capacity, price)
       VALUES ('2-я смена — Турция', 'Турция', '2025-07-15', '2025-07-28', 25, 75000)
       RETURNING id`,
    );

    const [session3] = await queryRunner.query(
      `INSERT INTO "sessions" (title, country, start_date, end_date, capacity, price)
       VALUES ('3-я смена — Россия, Анапа', 'Россия', '2025-08-01', '2025-08-14', 40, 55000)
       RETURNING id`,
    );

    console.log('Смены созданы');

    // Дети
    const [petya] = await queryRunner.query(
      `INSERT INTO "children" (parent_id, first_name, last_name, patronymic, birth_date)
       VALUES ($1, 'Петя', 'Иванов', 'Иванович', '2015-03-15')
       RETURNING id`,
      [ivanov.id],
    );

    const [masha] = await queryRunner.query(
      `INSERT INTO "children" (parent_id, first_name, last_name, patronymic, birth_date)
       VALUES ($1, 'Маша', 'Петрова', 'Алексеевна', '2013-07-22')
       RETURNING id`,
      [petrova.id],
    );

    const [kolya] = await queryRunner.query(
      `INSERT INTO "children" (parent_id, first_name, last_name, patronymic, birth_date, medical_notes)
       VALUES ($1, 'Коля', 'Сидоров', 'Алексеевич', '2016-01-10', 'Аллергия на орехи')
       RETURNING id`,
      [sidorov.id],
    );

    const [anya] = await queryRunner.query(
      `INSERT INTO "children" (parent_id, first_name, last_name, patronymic, birth_date)
       VALUES ($1, 'Аня', 'Сидорова', 'Алексеевна', '2014-09-05')
       RETURNING id`,
      [sidorov.id],
    );

    console.log('Дети созданы');

    // Заявки
    const [app1] = await queryRunner.query(
      `INSERT INTO "applications" (application_number, parent_id, child_id, session_id, status, assigned_manager_id, notes)
       VALUES ('JC-2025-0001', $1, $2, $3, 'review', $4, 'Первая заявка, ожидает рассмотрения')
       RETURNING id`,
      [ivanov.id, petya.id, session1.id, admin.id],
    );

    const [app2] = await queryRunner.query(
      `INSERT INTO "applications" (application_number, parent_id, child_id, session_id, status, assigned_manager_id, notes)
       VALUES ('JC-2025-0002', $1, $2, $3, 'processing', $4, 'Документы на проверке')
       RETURNING id`,
      [petrova.id, masha.id, session1.id, manager.id],
    );

    const [app3] = await queryRunner.query(
      `INSERT INTO "applications" (application_number, parent_id, child_id, session_id, status, assigned_manager_id)
       VALUES ('JC-2025-0003', $1, $2, $3, 'awaiting_payment', $4)
       RETURNING id`,
      [sidorov.id, kolya.id, session2.id, admin.id],
    );

    const [app4] = await queryRunner.query(
      `INSERT INTO "applications" (application_number, parent_id, child_id, session_id, status, assigned_manager_id)
       VALUES ('JC-2025-0004', $1, $2, $3, 'paid', $4)
       RETURNING id`,
      [sidorov.id, anya.id, session3.id, manager.id],
    );

    const [app5] = await queryRunner.query(
      `INSERT INTO "applications" (application_number, parent_id, child_id, session_id, status, assigned_manager_id)
       VALUES ('JC-2025-0005', $1, $2, $3, 'completed', $4)
       RETURNING id`,
      [ivanov.id, petya.id, session3.id, admin.id],
    );

    console.log('Заявки созданы');

    // Сообщения чата
    await queryRunner.query(
      `INSERT INTO "messages" (application_id, sender_id, text, is_read)
       VALUES ($1, $2, 'Здравствуйте! Подскажите, пожалуйста, какие документы нужны для оформления?', true)`,
      [app1.id, ivanov.id],
    );

    await queryRunner.query(
      `INSERT INTO "messages" (application_id, sender_id, text, is_read)
       VALUES ($1, $2, 'Добрый день! Вам потребуется скан паспорта родителя и свидетельство о рождении ребёнка.', true)`,
      [app1.id, admin.id],
    );

    await queryRunner.query(
      `INSERT INTO "messages" (application_id, sender_id, text, is_read)
       VALUES ($1, $2, 'Спасибо! Загружу документы сегодня.', false)`,
      [app1.id, ivanov.id],
    );

    await queryRunner.query(
      `INSERT INTO "messages" (application_id, sender_id, text, is_read)
       VALUES ($1, $2, 'Добрый день, когда можно ожидать счёт на оплату?', true)`,
      [app2.id, petrova.id],
    );

    await queryRunner.query(
      `INSERT INTO "messages" (application_id, sender_id, text, is_read)
       VALUES ($1, $2, 'Здравствуйте! Счёт будет готов в течение 2 рабочих дней.', false)`,
      [app2.id, manager.id],
    );

    console.log('Сообщения чата созданы');

    // Уведомления
    await queryRunner.query(
      `INSERT INTO "notifications" (user_id, type, title, body, related_application_id)
       VALUES ($1, 'status_change', 'Статус заявки изменён', 'Ваша заявка JC-2025-0003 переведена в статус "Ожидает предоплаты"', $2)`,
      [sidorov.id, app3.id],
    );

    await queryRunner.query(
      `INSERT INTO "notifications" (user_id, type, title, body, related_application_id)
       VALUES ($1, 'new_message', 'Новое сообщение', 'У вас новое сообщение по заявке JC-2025-0001', $2)`,
      [ivanov.id, app1.id],
    );

    console.log('Уведомления созданы');
    console.log('✅ Seed завершён успешно!');
  } catch (error) {
    console.error('Ошибка при заполнении данных:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
