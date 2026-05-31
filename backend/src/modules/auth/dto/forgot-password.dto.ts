import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@mail.ru' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;
}
