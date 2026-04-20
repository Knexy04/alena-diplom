import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  async findAll(): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: { isActive: true },
      order: { startDate: 'ASC' },
    });
  }

  async findById(id: string): Promise<Session | null> {
    return this.sessionsRepository.findOne({ where: { id } });
  }
}
