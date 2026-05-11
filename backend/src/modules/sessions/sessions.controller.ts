import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Смены')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Список активных смен' })
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Get('all')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Все смены (включая неактивные) — для менеджера' })
  async findAllForManager() {
    return this.sessionsService.findAllForManager();
  }

  @Get(':id/export.xlsx')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Экспорт списка участников смены в xlsx' })
  async exportXlsx(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename, asciiFilename } =
      await this.sessionsService.buildExportXlsx(id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали смены' })
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Создать смену' })
  async create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Обновить смену' })
  async update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить смену' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.sessionsService.remove(id);
  }
}
