import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Application } from '../applications/entities/application.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async getMessages(applicationId: string, page = 1, limit = 50) {
    const [items, total] = await this.messagesRepository.findAndCount({
      where: { applicationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async createMessage(data: {
    applicationId: string;
    senderId: string;
    text?: string;
    filePath?: string;
    fileName?: string;
  }): Promise<Message> {
    const message = this.messagesRepository.create(data);
    const saved = await this.messagesRepository.save(message);
    const full = await this.messagesRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['sender'],
    });

    this.notifyRecipients(data.applicationId, data.senderId, data.text, data.fileName).catch((err) => {
      this.logger.warn(`Не удалось создать уведомление о сообщении: ${(err as Error).message}`);
    });

    return full;
  }

  private async notifyRecipients(
    applicationId: string,
    senderId: string,
    text?: string,
    fileName?: string,
  ) {
    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId },
      select: ['id', 'applicationNumber', 'parentId', 'assignedManagerId'],
    });
    if (!application) return;

    const sender = await this.usersRepository.findOne({
      where: { id: senderId },
      select: ['id', 'role', 'firstName', 'lastName'],
    });
    if (!sender) return;

    const recipientIds = new Set<string>();
    if (sender.role === UserRole.PARENT) {
      // Сообщение от родителя — уведомляем всех менеджеров
      const managers = await this.usersRepository.find({
        where: { role: UserRole.MANAGER },
        select: ['id'],
      });
      managers.forEach((m) => recipientIds.add(m.id));
    } else if (application.parentId) {
      // Сообщение от менеджера — уведомляем родителя
      recipientIds.add(application.parentId);
    }

    recipientIds.delete(senderId);
    if (recipientIds.size === 0) return;

    const senderName = [sender.lastName, sender.firstName].filter(Boolean).join(' ').trim() || 'Пользователь';
    const preview = text?.trim()
      ? text.length > 100
        ? `${text.slice(0, 100)}…`
        : text
      : fileName
        ? `📎 ${fileName}`
        : 'Новое сообщение';

    await Promise.all(
      Array.from(recipientIds).map((userId) =>
        this.notificationsService.create({
          userId,
          type: NotificationType.NEW_MESSAGE,
          title: `Новое сообщение от ${senderName}`,
          body: `Заявка ${application.applicationNumber}: ${preview}`,
          relatedApplicationId: application.id,
        }),
      ),
    );
  }

  async markAsRead(applicationId: string, userId: string): Promise<void> {
    await this.messagesRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('application_id = :applicationId', { applicationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = false')
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messagesRepository
      .createQueryBuilder('msg')
      .innerJoin('msg.application', 'app')
      .where('(app.parent_id = :userId OR app.assigned_manager_id = :userId)', { userId })
      .andWhere('msg.sender_id != :userId', { userId })
      .andWhere('msg.is_read = false')
      .getCount();
  }
}
