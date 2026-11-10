import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from './public.decorator.js';
import { USER_REPOSITORY, type UserRepository } from './user.repository.js';
import { signingSecret, type AuthenticatedUser } from './login.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC,
      [context.getHandler(), context.getClass()])) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string }; user?: AuthenticatedUser;
    }>();
    const match = /^Bearer (\S+)$/i.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('Se requiere un token Bearer');
    const secret = signingSecret();
    try {
      const claims = await this.jwt.verifyAsync<{ sub?: unknown }>(match[1],
        { secret, algorithms: ['HS256'] });
      if (typeof claims.sub !== 'string') throw new UnauthorizedException();
      const user = await this.users.findById(claims.sub);
      if (!user?.active) throw new UnauthorizedException();
      request.user = { id: user.id, email: user.email, nickname: user.nickname, role: user.role };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido o vencido');
    }
  }
}
