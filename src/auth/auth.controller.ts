import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiOperation, ApiResponse, ApiServiceUnavailableResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RegisterDto } from './register.dto.js';
import { RegisterService } from './register.service.js';
import { LoginDto } from './login.dto.js';
import { LoginService, type AuthenticatedUser } from './login.service.js';
import { Public } from './public.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly registerService: RegisterService, private readonly loginService: LoginService) {}

  @Post('register')
  @Public()
  @HttpCode(201)
  @ApiOperation({ summary: 'Registrar un estudiante con correo institucional' })
  @ApiResponse({ status: 201, description: 'Estudiante creado.' })
  @ApiBadRequestResponse({ description: 'Datos de registro inválidos.' })
  @ApiConflictResponse({ description: 'Correo, apodo o código estudiantil ya registrado.' })
  @ApiServiceUnavailableResponse({ description: 'La conexión a PostgreSQL no está configurada.' })
  async register(@Body() input: RegisterDto): Promise<void> {
    await this.registerService.register(input);
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión y obtener un token de acceso' })
  @ApiResponse({ status: 200, description: 'Token Bearer con vigencia de una hora.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  login(@Body() input: LoginDto): Promise<{ accessToken: string; tokenType: 'Bearer'; expiresIn: number }> {
    return this.loginService.login(input);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar la identidad de la sesión' })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o vencido.' })
  me(@Req() request: { user: AuthenticatedUser }): AuthenticatedUser {
    return request.user;
  }
}
