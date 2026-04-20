import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DocumentType } from './entities/document.entity';

@ApiTags('Документы')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Загрузка документа' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('applicationId') applicationId: string,
    @Body('type') type: DocumentType,
    @CurrentUser() user: { id: string },
  ) {
    return this.documentsService.upload(file, applicationId, user.id, type);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Скачивание документа' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.findById(id);
    const filePath = this.documentsService.getFilePath(doc.filePath);
    res.download(filePath, doc.originalName);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Удаление документа' })
  async remove(@Param('id') id: string) {
    await this.documentsService.remove(id);
    return { message: 'Документ удалён' };
  }
}

@ApiTags('Документы заявки')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications/:applicationId/documents')
export class ApplicationDocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Документы заявки' })
  async findByApplication(@Param('applicationId') applicationId: string) {
    return this.documentsService.findByApplication(applicationId);
  }
}
