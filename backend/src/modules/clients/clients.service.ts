import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Child } from './entities/child.entity';
import { Application } from '../applications/entities/application.entity';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Child)
    private childrenRepository: Repository<Child>,
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    private dataSource: DataSource,
  ) {}

  async findAllClients(search?: string) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.PARENT });

    if (search) {
      qb.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('user.created_at', 'DESC');
    const clients = await qb.getMany();

    const result = await Promise.all(
      clients.map(async (client) => {
        const children = await this.childrenRepository.find({
          where: { parentId: client.id },
        });
        return { ...client, children };
      }),
    );

    return result;
  }

  async findClientById(id: string) {
    const client = await this.usersRepository.findOne({
      where: { id, role: UserRole.PARENT },
    });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    const children = await this.childrenRepository.find({
      where: { parentId: id },
    });

    const applications = await this.applicationsRepository.find({
      where: { parentId: id },
      relations: ['child', 'session'],
      order: { createdAt: 'DESC' },
    });

    return { ...client, children, applications };
  }

  async updateClient(id: string, dto: UpdateClientDto) {
    const client = await this.usersRepository.findOne({
      where: { id, role: UserRole.PARENT },
    });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }
    Object.assign(client, dto);
    return this.usersRepository.save(client);
  }

  async deleteClient(id: string): Promise<void> {
    const client = await this.usersRepository.findOne({
      where: { id, role: UserRole.PARENT },
    });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM notifications WHERE user_id = $1', [id]);
      await manager.query(
        'UPDATE applications SET assigned_manager_id = NULL WHERE assigned_manager_id = $1',
        [id],
      );
      await manager.query('DELETE FROM messages WHERE sender_id = $1', [id]);
      await manager.query('DELETE FROM documents WHERE uploaded_by_id = $1', [id]);
      await manager.query('DELETE FROM users WHERE id = $1', [id]);
    });
  }

  async addChild(parentId: string, dto: CreateChildDto) {
    const parent = await this.usersRepository.findOne({
      where: { id: parentId, role: UserRole.PARENT },
    });
    if (!parent) {
      throw new NotFoundException('Родитель не найден');
    }

    const child = this.childrenRepository.create({
      parentId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      patronymic: dto.patronymic,
      birthDate: dto.birthDate,
      medicalNotes: dto.medicalNotes,
    });

    return this.childrenRepository.save(child);
  }

  async updateChild(childId: string, dto: UpdateChildDto) {
    const child = await this.childrenRepository.findOne({
      where: { id: childId },
    });
    if (!child) {
      throw new NotFoundException('Ребёнок не найден');
    }
    Object.assign(child, dto);
    return this.childrenRepository.save(child);
  }

  async getChildrenByParent(parentId: string) {
    return this.childrenRepository.find({ where: { parentId } });
  }
}
