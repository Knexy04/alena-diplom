import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Child } from '../../clients/entities/child.entity';
import { Session } from '../../sessions/entities/session.entity';

export enum ApplicationStatus {
  REVIEW = 'review',
  PROCESSING = 'processing',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  COMPLETED = 'completed',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'application_number' })
  applicationNumber: string;

  @Column({ type: 'uuid', name: 'parent_id' })
  parentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({ type: 'uuid', name: 'child_id' })
  childId: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  @Column({ type: 'uuid', name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.REVIEW,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_manager_id' })
  assignedManagerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_manager_id' })
  assignedManager: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
