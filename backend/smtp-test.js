// Временный скрипт для проверки SMTP. Читает настройки из переменных окружения
// (как и само приложение). Удаляется после теста.
const nodemailer = require('nodemailer');

const cfg = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: (process.env.SMTP_SECURE || 'true') === 'true',
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM,
};

console.log('Настройки SMTP, которые видит контейнер:');
console.log('  HOST:', cfg.host);
console.log('  PORT:', cfg.port, '| SECURE:', cfg.secure);
console.log('  USER:', cfg.user || '(пусто!)');
console.log('  PASSWORD:', cfg.password ? `задан (${cfg.password.length} симв.)` : '(пусто!)');
console.log('  FROM:', cfg.from || '(пусто!)');
console.log('');

if (!cfg.user || !cfg.password) {
  console.error('✗ SMTP_USER или SMTP_PASSWORD не заданы в окружении контейнера.');
  console.error('  Проверь .env на сервере и пересобери/перезапусти контейнер.');
  process.exit(1);
}

async function main() {
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
  });

  console.log('Проверяю подключение к SMTP...');
  await transporter.verify();
  console.log('✓ SMTP-подключение успешно');

  const info = await transporter.sendMail({
    from: cfg.from,
    to: cfg.user,
    subject: 'Тест: код восстановления пароля — Джуниор Кэмп',
    text: 'Тестовый код: 123456',
    html: '<h2 style="color:#ea580c">Тест отправки</h2><p>Код: <b>123456</b></p>',
  });
  console.log('✓ Письмо отправлено, messageId:', info.messageId);
  console.log('  accepted:', info.accepted);
}

main().catch((e) => {
  console.error('✗ Ошибка:', e.message);
  process.exit(1);
});
