import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { FilterApplicationDto } from './dto/filter-application.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.REVIEW]: 'На рассмотрении',
  [ApplicationStatus.PROCESSING]: 'В обработке',
  [ApplicationStatus.AWAITING_PAYMENT]: 'Ожидает предоплаты',
  [ApplicationStatus.PAID]: 'Оплачено',
  [ApplicationStatus.COMPLETED]: 'Завершено',
};

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(filter: FilterApplicationDto, parentId?: string) {
    const qb = this.applicationsRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.parent', 'parent')
      .leftJoinAndSelect('app.child', 'child')
      .leftJoinAndSelect('app.session', 'session')
      .leftJoinAndSelect('app.assignedManager', 'manager');

    if (parentId) {
      qb.andWhere('app.parentId = :parentId', { parentId });
    }

    if (filter.status) {
      const statuses = filter.status.split(',');
      qb.andWhere('app.status IN (:...statuses)', { statuses });
    }

    if (filter.sessionId) {
      qb.andWhere('app.sessionId = :sessionId', { sessionId: filter.sessionId });
    }

    if (filter.search) {
      qb.andWhere(
        '(child.firstName ILIKE :search OR child.lastName ILIKE :search OR parent.firstName ILIKE :search OR parent.lastName ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.dateFrom) {
      qb.andWhere('session.startDate >= :dateFrom', { dateFrom: filter.dateFrom });
    }

    if (filter.dateTo) {
      qb.andWhere('session.endDate <= :dateTo', { dateTo: filter.dateTo });
    }

    const sortByMap: Record<string, string> = {
      createdAt: 'app.createdAt',
      applicationNumber: 'app.applicationNumber',
      status: 'app.status',
    };
    const sortField = sortByMap[filter.sortBy || 'createdAt'] || 'app.createdAt';
    qb.orderBy(sortField, filter.sortOrder || 'DESC');

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Application> {
    const app = await this.applicationsRepository.findOne({
      where: { id },
      relations: ['parent', 'child', 'session', 'assignedManager'],
    });
    if (!app) {
      throw new NotFoundException('Заявка не найдена');
    }
    return app;
  }

  async create(
    dto: CreateApplicationDto,
    parentId: string,
    assignedManagerId?: string,
  ): Promise<Application> {
    const applicationNumber = await this.generateApplicationNumber();

    const application = this.applicationsRepository.create({
      applicationNumber,
      parentId,
      childId: dto.childId,
      sessionId: dto.sessionId,
      status: ApplicationStatus.REVIEW,
      notes: dto.notes,
      assignedManagerId,
    });

    const saved = await this.applicationsRepository.save(application);
    this.logger.log(`Создана заявка ${applicationNumber}`);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    const application = await this.findById(id);
    const previousStatus = application.status;
    Object.assign(application, dto);
    await this.applicationsRepository.save(application);
    this.logger.log(`Обновлена заявка ${application.applicationNumber}, статус: ${application.status}`);

    if (dto.status && dto.status !== previousStatus) {
      try {
        await this.notificationsService.create({
          userId: application.parentId,
          type: NotificationType.STATUS_CHANGE,
          title: `Статус заявки ${application.applicationNumber}`,
          body: `Новый статус: ${STATUS_LABELS[application.status] || application.status}`,
          relatedApplicationId: application.id,
        });
      } catch (err) {
        this.logger.warn(`Не удалось создать уведомление о статусе: ${(err as Error).message}`);
      }
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const application = await this.findById(id);

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'UPDATE notifications SET related_application_id = NULL WHERE related_application_id = $1',
        [id],
      );
      await manager.query('DELETE FROM applications WHERE id = $1', [id]);
    });

    this.cleanupApplicationFiles(id);

    this.logger.log(`Удалена заявка ${application.applicationNumber}`);
  }

  private cleanupApplicationFiles(applicationId: string) {
    const dirs = [
      path.join(this.uploadDir, applicationId),
      path.join(this.uploadDir, 'chat', applicationId),
    ];
    for (const dir of dirs) {
      try {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch (err) {
        this.logger.warn(`Не удалось удалить ${dir}: ${(err as Error).message}`);
      }
    }
  }

  private async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JC-${year}-`;

    const lastApp = await this.applicationsRepository
      .createQueryBuilder('app')
      .where('app.applicationNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('app.applicationNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastApp) {
      const lastNumber = parseInt(lastApp.applicationNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}
