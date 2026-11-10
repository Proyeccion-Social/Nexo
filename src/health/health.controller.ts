import { Controller, Get, Header, HttpCode } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';

@Controller()
export class HealthController {
  @Get('ping')
  @Public()
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  ping(): string {
    return 'pong';
  }
}
