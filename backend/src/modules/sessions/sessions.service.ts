import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Session } from './entities/session.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

const statusLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.REVIEW]: 'На рассмотрении',
  [ApplicationStatus.PROCESSING]: 'В обработке',
  [ApplicationStatus.AWAITING_PAYMENT]: 'Ожидает предоплаты',
  [ApplicationStatus.PAID]: 'Оплачено',
  [ApplicationStatus.COMPLETED]: 'Завершено',
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
  ) {}

  async findAll(): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: { isActive: true },
      order: { startDate: 'ASC' },
    });
  }

  async findAllForManager(): Promise<Session[]> {
    return this.sessionsRepository.find({
      order: { startDate: 'ASC' },
    });
  }

  async findById(id: string): Promise<Session> {
    const session = await this.sessionsRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException('Смена не найдена');
    }
    return session;
  }

  async create(dto: CreateSessionDto): Promise<Session> {
    this.assertDateRange(dto.startDate, dto.endDate);
    const session = this.sessionsRepository.create(dto);
    return this.sessionsRepository.save(session);
  }

  async update(id: string, dto: UpdateSessionDto): Promise<Session> {
    const session = await this.findById(id);
    const startDate = dto.startDate ?? session.startDate;
    const endDate = dto.endDate ?? session.endDate;
    this.assertDateRange(startDate, endDate);
    Object.assign(session, dto);
    return this.sessionsRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findById(id);
    await this.sessionsRepository.remove(session);
  }

  async buildExportXlsx(
    id: string,
  ): Promise<{ buffer: Buffer; filename: string; asciiFilename: string }> {
    const session = await this.findById(id);
    const applications = await this.applicationsRepository.find({
      where: { sessionId: id },
      relations: ['parent', 'child'],
      order: { createdAt: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Junior Camp CRM';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Участники', {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Смена «${session.title}» (${session.country})`;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

    sheet.mergeCells('A2:L2');
    const subCell = sheet.getCell('A2');
    subCell.value = `${this.formatDate(session.startDate)} — ${this.formatDate(session.endDate)} · вместимость ${session.capacity} · стоимость ${Number(session.price).toLocaleString('ru-RU')} ₽ · участников ${applications.length}`;
    subCell.font = { size: 11, color: { argb: 'FF64748B' } };
    sheet.getRow(2).height = 18;
    sheet.getRow(3).height = 6;

    const headerRow = sheet.getRow(4);
    const headers = [
      '№',
      '№ заявки',
      'ФИО ребёнка',
      'Дата рождения',
      'Возраст',
      'Мед. особенности',
      'ФИО родителя',
      'Email',
      'Телефон',
      'Статус',
      'Комментарий',
      'Дата подачи',
    ];
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF37022' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
    headerRow.height = 26;

    sheet.columns = [
      { key: 'idx', width: 6 },
      { key: 'number', width: 16 },
      { key: 'childName', width: 28 },
      { key: 'birthDate', width: 14 },
      { key: 'age', width: 8 },
      { key: 'medical', width: 24 },
      { key: 'parentName', width: 28 },
      { key: 'email', width: 24 },
      { key: 'phone', width: 18 },
      { key: 'status', width: 18 },
      { key: 'notes', width: 32 },
      { key: 'createdAt', width: 14 },
    ];

    applications.forEach((app, index) => {
      const row = sheet.addRow({
        idx: index + 1,
        number: app.applicationNumber,
        childName: this.fullName(app.child),
        birthDate: app.child?.birthDate ? this.formatDate(app.child.birthDate) : '',
        age: this.calculateAge(app.child?.birthDate, session.startDate),
        medical: app.child?.medicalNotes || '',
        parentName: this.fullName(app.parent),
        email: app.parent?.email || '',
        phone: app.parent?.phone || '',
        status: statusLabels[app.status] || app.status,
        notes: app.notes || '',
        createdAt: this.formatDate(app.createdAt),
      });
      row.alignment = { vertical: 'top', wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    if (applications.length === 0) {
      const row = sheet.addRow({ idx: '', childName: 'Нет заявок на эту смену' });
      sheet.mergeCells(`A${row.number}:L${row.number}`);
      const cell = sheet.getCell(`A${row.number}`);
      cell.alignment = { horizontal: 'center' };
      cell.font = { italic: true, color: { argb: 'FF94A3B8' } };
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
    const niceName = `Смена ${session.title} ${session.startDate}.xlsx`;
    const asciiName = `session_${this.slugify(session.title)}_${session.startDate}.xlsx`;
    return { buffer, filename: niceName, asciiFilename: asciiName };
  }

  private fullName(p?: { firstName?: string; lastName?: string; patronymic?: string } | null): string {
    if (!p) return '';
    return [p.lastName, p.firstName, p.patronymic].filter(Boolean).join(' ').trim();
  }

  private formatDate(value: string | Date): string {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${d.getFullYear()}`;
  }

  private calculateAge(birthDate?: string, asOf?: string): number | '' {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const ref = asOf ? new Date(asOf) : new Date();
    if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return '';
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'session';
  }

  private assertDateRange(start: string, end: string) {
    if (new Date(start) > new Date(end)) {
      throw new BadRequestException('Дата окончания должна быть не раньше даты начала');
    }
  }
}
