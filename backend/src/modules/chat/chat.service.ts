import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
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
    return this.messagesRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['sender'],
    });
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
