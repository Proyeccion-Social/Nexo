import { Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginDto } from './login.dto.js';
import { USER_REPOSITORY, type UserRepository } from './user.repository.js';
import type { UserRole } from './user.entity.js';
import { PASSWORD_HASHER, type PasswordHasher } from './password-hasher.js';

const DUMMY_PASSWORD_HASH = '$2b$12$cU8b3VCDT2cvk8PFvXu3C.wi5Ie/.h.rCoj6WV6fZG2u.ixed9Dx6';

export interface AuthenticatedUser {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
}

export function signingSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new ServiceUnavailableException('JWT_SECRET debe contener al menos 32 bytes');
  }
  return secret;
}

@Injectable()
export class LoginService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async login(input: LoginDto): Promise<{ accessToken: string; tokenType: 'Bearer'; expiresIn: number }> {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    const validPassword = await this.passwords.verify(
      input.password, user?.active ? user.passwordHash : DUMMY_PASSWORD_HASH,
    );
    if (!user?.active || !validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const accessToken = await this.jwt.signAsync({ sub: user.id },
      { secret: signingSecret(), expiresIn: '1h', algorithm: 'HS256' });
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }
}
