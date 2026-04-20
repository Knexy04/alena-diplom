import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../users/entities/user.entity';

export enum DocumentType {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  PASSPORT_SCAN = 'passport_scan',
  MEDICAL_CERTIFICATE = 'medical_certificate',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'uuid', name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({ type: 'varchar', length: 255, name: 'original_name' })
  originalName: string;

  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  filePath: string;

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'integer', name: 'file_size' })
  fileSize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
