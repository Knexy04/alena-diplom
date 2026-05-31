import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { mailConfig } from '../../config/mail.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: {
          user: mailConfig.user,
          pass: mailConfig.password,
        },
      });
    }
    return this.transporter;
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    // Если SMTP не настроен — не роняем приложение, а пишем код в лог
    // (удобно для локальной разработки без реальной почты).
    if (!mailConfig.user || !mailConfig.password) {
      this.logger.warn(
        `SMTP не настроен. Код восстановления для ${email}: ${code}`,
      );
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Восстановление пароля</h2>
        <p>Вы запросили сброс пароля в системе «Джуниор Кэмп».</p>
        <p>Ваш код подтверждения:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e293b; background: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px;">
          ${code}
        </div>
        <p style="color: #64748b; margin-top: 16px;">Код действителен 15 минут. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
      </div>
    `;

    try {
      await this.getTransporter().sendMail({
        from: mailConfig.from,
        to: email,
        subject: 'Код восстановления пароля — Джуниор Кэмп',
        text: `Ваш код для сброса пароля: ${code}. Код действителен 15 минут.`,
        html,
      });
      this.logger.log(`Код восстановления отправлен на ${email}`);
    } catch (error) {
      this.logger.error(`Не удалось отправить письмо на ${email}`, error as Error);
      throw error;
    }
  }
}
