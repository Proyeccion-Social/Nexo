import { Controller, Get, Header, HttpCode } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('ping')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  ping(): string {
    return 'pong';
  }
}
