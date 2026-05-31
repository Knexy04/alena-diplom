import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from '../users/entities/user.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { jwtConfig } from '../../config/jwt.config';

const RESET_CODE_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(PasswordResetCode)
    private resetCodesRepository: Repository<PasswordResetCode>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`Пользователь ${user.email} вошёл в систему`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        patronymic: user.patronymic,
        phone: user.phone,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      role: UserRole.PARENT,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      patronymic: registerDto.patronymic,
      phone: registerDto.phone,
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`Зарегистрирован новый родитель: ${user.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        patronymic: user.patronymic,
        phone: user.phone,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConfig.refreshSecret,
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      const tokens = this.generateTokens(user.id, user.email, user.role);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Невалидный refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const genericResponse = {
      message:
        'Если аккаунт с таким email существует, на него отправлен код для сброса пароля',
    };

    const user = await this.usersService.findByEmail(dto.email);
    // Не раскрываем, существует ли пользователь с таким email.
    if (!user || !user.isActive) {
      return genericResponse;
    }

    // Удаляем предыдущие коды этого пользователя — действует только последний.
    await this.resetCodesRepository.delete({ userId: user.id });

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);

    await this.resetCodesRepository.save(
      this.resetCodesRepository.create({
        userId: user.id,
        codeHash,
        expiresAt,
        used: false,
      }),
    );

    await this.mailService.sendPasswordResetCode(user.email, code);

    this.logger.log(`Запрошен сброс пароля для ${user.email}`);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Неверный код или срок его действия истёк');
    }

    // Чистим протухшие коды, чтобы таблица не разрасталась.
    await this.resetCodesRepository.delete({ expiresAt: LessThan(new Date()) });

    const resetCode = await this.resetCodesRepository.findOne({
      where: { userId: user.id, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!resetCode || resetCode.expiresAt < new Date()) {
      throw new BadRequestException('Неверный код или срок его действия истёк');
    }

    const isCodeValid = await bcrypt.compare(dto.code, resetCode.codeHash);
    if (!isCodeValid) {
      throw new BadRequestException('Неверный код или срок его действия истёк');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);

    // Инвалидируем все коды пользователя после успешного сброса.
    await this.resetCodesRepository.delete({ userId: user.id });

    this.logger.log(`Пароль успешно сброшен для ${user.email}`);

    return { message: 'Пароль успешно изменён' };
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.accessExpiresIn as string | number,
    } as any);

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.refreshSecret,
      expiresIn: jwtConfig.refreshExpiresIn as string | number,
    } as any);

    return { accessToken, refreshToken };
  }
}
