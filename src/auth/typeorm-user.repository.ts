import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity.js';
import type { UserRepository } from './user.repository.js';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  async exists(email: string, nickname: string, studentCode: string): Promise<'email' | 'nickname' | 'studentCode' | null> {
    const repository = this.dataSource.getRepository(User);
    if (await repository.existsBy({ email })) return 'email';
    if (await repository.existsBy({ nickname })) return 'nickname';
    if (await repository.existsBy({ studentCode })) return 'studentCode';
    return null;
  }

  async save(user: Parameters<UserRepository['save']>[0]): Promise<void> {
    await this.dataSource.getRepository(User).insert(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.dataSource.getRepository(User).createQueryBuilder('user')
      .addSelect('user.passwordHash').where('user.email = :email', { email }).getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOneBy({ id });
  }
}

@Injectable()
export class UnavailableUserRepository implements UserRepository {
  private unavailable(): never {
    throw new ServiceUnavailableException('DATABASE_URL no está configurada');
  }

  async exists(): Promise<null> { return this.unavailable(); }
  async save(): Promise<void> { return this.unavailable(); }
  async findByEmail(): Promise<null> { return this.unavailable(); }
  async findById(): Promise<null> { return this.unavailable(); }
}
