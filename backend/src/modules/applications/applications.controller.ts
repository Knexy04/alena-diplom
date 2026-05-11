import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { FilterApplicationDto } from './dto/filter-application.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Заявки')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  private readonly logger = new Logger(ApplicationsController.name);

  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Список заявок с фильтрацией' })
  async findAll(
    @Query() filter: FilterApplicationDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    // Безопасный дефолт: если не явный менеджер — фильтруем по своему parent_id.
    // Так родитель никогда не увидит чужие заявки, даже при странном значении role.
    const parentId = user.role === UserRole.MANAGER ? undefined : user.id;
    if (user.role !== UserRole.MANAGER && user.role !== UserRole.PARENT) {
      this.logger.warn(
        `Неожиданная роль пользователя ${user.id}: ${user.role}. Фильтрую как PARENT.`,
      );
    }
    return this.applicationsService.findAll(filter, parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали заявки' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const application = await this.applicationsService.findById(id);
    if (user.role !== UserRole.MANAGER && application.parentId !== user.id) {
      throw new ForbiddenException('Заявка вам не принадлежит');
    }
    return application;
  }

  @Post()
  @ApiOperation({ summary: 'Создание заявки' })
  async create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    let parentId: string;
    let assignedManagerId: string | undefined;
    if (user.role === UserRole.PARENT) {
      parentId = user.id;
    } else {
      if (!dto.parentId) {
        throw new BadRequestException('Не указан родитель');
      }
      parentId = dto.parentId;
      assignedManagerId = user.id;
    }
    return this.applicationsService.create(dto, parentId, assignedManagerId);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Обновление заявки (только менеджер)' })
  async update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Удаление заявки (только менеджер)' })
  async remove(@Param('id') id: string) {
    await this.applicationsService.remove(id);
    return { message: 'Заявка удалена' };
  }
}
