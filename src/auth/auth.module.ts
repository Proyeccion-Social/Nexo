import { Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AuthController } from './auth.controller.js';
import { BcryptPasswordHasher, PASSWORD_HASHER } from './password-hasher.js';
import { RegisterService } from './register.service.js';
import { TypeOrmUserRepository, UnavailableUserRepository } from './typeorm-user.repository.js';
import { USER_REPOSITORY } from './user.repository.js';
import { User } from './user.entity.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginService } from './login.service.js';

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.dataSource?.isInitialized) await this.dataSource.destroy();
  }
}

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    RegisterService,
    LoginService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    DatabaseShutdown,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    {
      provide: DataSource,
      useFactory: async () => {
        if (!process.env.DATABASE_URL) return null;
        return new DataSource({ type: 'postgres', url: process.env.DATABASE_URL,
          entities: [User], synchronize: false, logging: false }).initialize();
      },
    },
    {
      provide: USER_REPOSITORY,
      inject: [DataSource],
      useFactory: (dataSource: DataSource | null) => dataSource
        ? new TypeOrmUserRepository(dataSource) : new UnavailableUserRepository(),
    },
  ],
})
export class AuthModule {}
