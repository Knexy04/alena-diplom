import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../applications/entities/application.entity';

export enum NotificationType {
  STATUS_CHANGE = 'status_change',
  NEW_MESSAGE = 'new_message',
  BROADCAST = 'broadcast',
  DOCUMENT_UPLOADED = 'document_uploaded',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'related_application_id' })
  relatedApplicationId: string;

  @ManyToOne(() => Application, { nullable: true })
  @JoinColumn({ name: 'related_application_id' })
  relatedApplication: Application;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
