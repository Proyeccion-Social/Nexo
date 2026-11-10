import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { RegisterDto } from './register.dto.js';
import { PASSWORD_HASHER, type PasswordHasher } from './password-hasher.js';
import { USER_REPOSITORY, type UserRepository } from './user.repository.js';
import { UserRole } from './user.entity.js';

@Injectable()
export class RegisterService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async register(input: RegisterDto): Promise<void> {
    const email = input.email.toLowerCase();
    const existing = await this.users.exists(email, input.nickname, input.studentCode);
    if (existing) throw new ConflictException(`Ya existe un usuario con ese ${existing}`);

    const passwordHash = await this.hasher.hash(input.password);
    const entrySemester = `${input.studentCode.slice(0, 4)}-${input.studentCode[4] === '1' ? '1' : '2'}`;
    try {
      await this.users.save({ email, nickname: input.nickname, studentCode: input.studentCode,
        entrySemester, passwordHash, role: UserRole.ESTUDIANTE, active: true });
    } catch (error) {
      // La restricción UNIQUE de PostgreSQL resuelve carreras entre la comprobación y el INSERT.
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        throw new ConflictException('El correo, apodo o código estudiantil ya está registrado');
      }
      throw error;
    }
  }
}
