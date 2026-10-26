import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return hash(password, 12);
  }
}
