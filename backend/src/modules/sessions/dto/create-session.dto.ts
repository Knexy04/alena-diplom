import {
  IsString,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: '4-я смена — Грузия' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Грузия' })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString({}, { message: 'Некорректная дата начала' })
  startDate: string;

  @ApiProperty({ example: '2026-07-14' })
  @IsDateString({}, { message: 'Некорректная дата окончания' })
  endDate: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1, { message: 'Вместимость должна быть больше 0' })
  capacity: number;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
