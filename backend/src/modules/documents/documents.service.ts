import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType } from './entities/document.entity';
import { Application } from '../applications/entities/application.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { decodeMultipartFilename } from '../../common/utils/multipart-filename.util';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async upload(
    file: Express.Multer.File,
    applicationId: string,
    uploadedById: string,
    type: DocumentType,
  ): Promise<Document> {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Допустимые форматы: PDF, JPG, PNG');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Максимальный размер файла: 10MB');
    }

    const dir = path.join(this.uploadDir, applicationId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const originalName = decodeMultipartFilename(file.originalname);
    const ext = path.extname(originalName);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const document = this.documentsRepository.create({
      applicationId,
      uploadedById,
      type,
      originalName,
      filePath: `${applicationId}/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    const saved = await this.documentsRepository.save(document);

    this.notifyOnUpload(applicationId, uploadedById, originalName).catch((err) => {
      this.logger.warn(`Не удалось создать уведомление о документе: ${(err as Error).message}`);
    });

    return saved;
  }

  private async notifyOnUpload(applicationId: string, uploadedById: string, fileName: string) {
    const uploader = await this.usersRepository.findOne({
      where: { id: uploadedById },
      select: ['id', 'role'],
    });
    if (!uploader) return;

    const application = await this.applicationsRepository.findOne({
      where: { id: applicationId },
      select: ['id', 'applicationNumber', 'parentId'],
    });
    if (!application) return;

    const recipientIds = new Set<string>();
    if (uploader.role === UserRole.MANAGER && application.parentId) {
      recipientIds.add(application.parentId);
    } else if (uploader.role === UserRole.PARENT) {
      const managers = await this.usersRepository.find({
        where: { role: UserRole.MANAGER },
        select: ['id'],
      });
      managers.forEach((m) => recipientIds.add(m.id));
    }

    recipientIds.delete(uploadedById);
    if (recipientIds.size === 0) return;

    await Promise.all(
      Array.from(recipientIds).map((userId) =>
        this.notificationsService.create({
          userId,
          type: NotificationType.DOCUMENT_UPLOADED,
          title: `Новый документ по заявке ${application.applicationNumber}`,
          body: `Загружен файл: ${fileName}`,
          relatedApplicationId: application.id,
        }),
      ),
    );
  }

  async findByApplication(applicationId: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { applicationId },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Document> {
    const doc = await this.documentsRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Документ не найден');
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    const doc = await this.findById(id);
    const fullPath = path.join(this.uploadDir, doc.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    await this.documentsRepository.remove(doc);
  }

  getFilePath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }
}
