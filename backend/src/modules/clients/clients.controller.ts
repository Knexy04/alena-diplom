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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Клиенты')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('me/children')
  @ApiOperation({ summary: 'Мои дети (для родителя)' })
  async getMyChildren(@CurrentUser() user: { id: string }) {
    return this.clientsService.getChildrenByParent(user.id);
  }

  @Get()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Список клиентов (родителей)' })
  async findAll(@Query('search') search?: string) {
    return this.clientsService.findAllClients(search);
  }

  @Get(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Карточка клиента' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findClientById(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Обновить данные клиента' })
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.updateClient(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить клиента со всеми связанными данными' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.clientsService.deleteClient(id);
  }

  @Post(':id/children')
  @ApiOperation({ summary: 'Добавить ребёнка' })
  async addChild(@Param('id') id: string, @Body() dto: CreateChildDto) {
    return this.clientsService.addChild(id, dto);
  }
}

@ApiTags('Дети')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('children')
export class ChildrenController {
  constructor(private clientsService: ClientsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные ребёнка' })
  async update(@Param('id') id: string, @Body() dto: UpdateChildDto) {
    return this.clientsService.updateChild(id, dto);
  }
}
