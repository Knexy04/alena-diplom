import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { Application } from '../applications/entities/application.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedApplicationId?: string;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(data);
    return this.notificationsRepository.save(notification);
  }

  async findByUser(userId: string, limit = 20) {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }

  async broadcast(sessionId: string, title: string, body: string) {
    const applications = await this.applicationsRepository.find({
      where: { sessionId },
      select: ['parentId'],
    });

    const uniqueParentIds = [...new Set(applications.map((a) => a.parentId))];

    const notifications = uniqueParentIds.map((parentId) =>
      this.notificationsRepository.create({
        userId: parentId,
        type: NotificationType.BROADCAST,
        title,
        body,
      }),
    );

    await this.notificationsRepository.save(notifications);

    return { recipientCount: uniqueParentIds.length };
  }
}
