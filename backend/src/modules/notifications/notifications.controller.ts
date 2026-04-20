import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Уведомления')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Уведомления текущего пользователя' })
  async findAll(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findByUser(user.id, parseInt(limit || '20'));
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Количество непрочитанных' })
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Пометить как прочитанное' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(id);
    return { message: 'Прочитано' };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Пометить все как прочитанные' })
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    await this.notificationsService.markAllAsRead(user.id);
    return { message: 'Все прочитано' };
  }

  @Post('broadcast')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Массовая рассылка по смене' })
  async broadcast(
    @Body() body: { sessionId: string; title: string; body: string },
  ) {
    return this.notificationsService.broadcast(body.sessionId, body.title, body.body);
  }
}
