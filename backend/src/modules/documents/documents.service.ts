import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType } from './entities/document.entity';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
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

    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const document = this.documentsRepository.create({
      applicationId,
      uploadedById,
      type,
      originalName: file.originalname,
      filePath: `${applicationId}/${fileName}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.documentsRepository.save(document);
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
