// Временный скрипт для проверки SMTP. Удаляется после теста.
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Читаем .env из корня проекта
const envPath = path.join(__dirname, '..', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}

async function main() {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT),
    secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    family: 4,
  });

  console.log('Проверяю подключение к SMTP...');
  await transporter.verify();
  console.log('✓ SMTP-подключение успешно');

  const code = '123456';
  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to: env.SMTP_USER,
    subject: 'Тест: код восстановления пароля — Джуниор Кэмп',
    text: `Тестовый код: ${code}`,
    html: `<h2 style="color:#ea580c">Тест отправки</h2><p>Код: <b>${code}</b></p>`,
  });
  console.log('✓ Письмо отправлено, messageId:', info.messageId);
}

main().catch((e) => {
  console.error('✗ Ошибка:', e.message);
  process.exit(1);
});
