import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Смены')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Список активных смен' })
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали смены' })
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }
}
