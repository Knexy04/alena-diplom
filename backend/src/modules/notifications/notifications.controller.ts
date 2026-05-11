import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { decodeMultipartFilename } from '../../common/utils/multipart-filename.util';

@ApiTags('Уведомления')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';

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
  @ApiOperation({ summary: 'Массовая рассылка по смене (с опциональным файлом)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async broadcast(
    @Body() body: { sessionId?: string; title?: string; body?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const sessionId = body.sessionId?.trim();
    const title = body.title?.trim();
    const messageBody = body.body?.trim();
    if (!sessionId || !title || !messageBody) {
      throw new BadRequestException('sessionId, title и body обязательны');
    }

    let saved: { filePath: string; fileName: string } | undefined;
    if (file) {
      const originalName = decodeMultipartFilename(file.originalname);
      const ext = path.extname(originalName);
      const fileName = `${uuidv4()}${ext}`;
      const dir = path.join(this.uploadDir, 'broadcast');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, fileName), file.buffer);
      saved = { filePath: `broadcast/${fileName}`, fileName: originalName };
    }

    return this.notificationsService.broadcast(sessionId, title, messageBody, saved);
  }
}
