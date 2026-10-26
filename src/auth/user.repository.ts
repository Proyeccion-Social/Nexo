import type { User } from './user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  exists(email: string, nickname: string, studentCode: string): Promise<'email' | 'nickname' | 'studentCode' | null>;
  save(user: Pick<User, 'email' | 'nickname' | 'studentCode' | 'entrySemester' | 'passwordHash' | 'role' | 'active'>): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
