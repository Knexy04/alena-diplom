import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Чат')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor(private chatService: ChatService) {}

  @Get(':applicationId/messages')
  @ApiOperation({ summary: 'История сообщений' })
  async getMessages(
    @Param('applicationId') applicationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      applicationId,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  @Post(':applicationId/upload')
  @ApiOperation({ summary: 'Загрузка файла в чат' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(
    @Param('applicationId') applicationId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    const dir = path.join(this.uploadDir, 'chat', applicationId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const relativePath = `chat/${applicationId}/${fileName}`;

    const message = await this.chatService.createMessage({
      applicationId,
      senderId: user.id,
      filePath: relativePath,
      fileName: file.originalname,
    });

    return message;
  }
}
