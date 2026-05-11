import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'parent@mail.ru' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @ApiProperty({ example: 'Иван' })
  @IsString({ message: 'Имя обязательно' })
  firstName: string;

  @ApiProperty({ example: 'Иванов' })
  @IsString({ message: 'Фамилия обязательна' })
  lastName: string;

  @ApiPropertyOptional({ example: 'Иванович' })
  @IsOptional()
  @IsString()
  patronymic?: string;

  @ApiPropertyOptional({ example: '+7 999 123-45-67' })
  @IsOptional()
  @IsString()
  phone?: string;
}
