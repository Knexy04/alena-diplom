import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Некорректный ID ребёнка' })
  childId: string;

  @ApiProperty()
  @IsUUID('4', { message: 'Некорректный ID смены' })
  sessionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
