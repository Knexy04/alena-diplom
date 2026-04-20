import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChildDto {
  @ApiProperty({ example: 'Петя' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Иванов' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Иванович' })
  @IsOptional()
  @IsString()
  patronymic?: string;

  @ApiProperty({ example: '2015-05-15' })
  @IsDateString({}, { message: 'Некорректная дата рождения' })
  birthDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalNotes?: string;
}
