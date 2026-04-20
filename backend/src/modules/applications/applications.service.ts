import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { FilterApplicationDto } from './dto/filter-application.dto';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
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

  async create(dto: CreateApplicationDto, parentId: string): Promise<Application> {
    const applicationNumber = await this.generateApplicationNumber();

    const application = this.applicationsRepository.create({
      applicationNumber,
      parentId,
      childId: dto.childId,
      sessionId: dto.sessionId,
      status: ApplicationStatus.REVIEW,
      notes: dto.notes,
    });

    const saved = await this.applicationsRepository.save(application);
    this.logger.log(`Создана заявка ${applicationNumber}`);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    const application = await this.findById(id);
    Object.assign(application, dto);
    await this.applicationsRepository.save(application);
    this.logger.log(`Обновлена заявка ${application.applicationNumber}, статус: ${application.status}`);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const application = await this.findById(id);
    await this.applicationsRepository.remove(application);
    this.logger.log(`Удалена заявка ${application.applicationNumber}`);
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
