import {
  Controller,
  Get,
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
  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Список заявок с фильтрацией' })
  async findAll(
    @Query() filter: FilterApplicationDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const parentId = user.role === UserRole.PARENT ? user.id : undefined;
    return this.applicationsService.findAll(filter, parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали заявки' })
  async findOne(@Param('id') id: string) {
    return this.applicationsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создание заявки' })
  async create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const parentId = user.role === UserRole.PARENT ? user.id : user.id;
    return this.applicationsService.create(dto, parentId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновление заявки' })
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
