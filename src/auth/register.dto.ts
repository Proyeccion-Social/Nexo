import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { MaxPasswordBytes } from './max-password-bytes.decorator.js';

export class RegisterDto {
  @ApiProperty({ example: 'estudiante@udistrital.edu.co', format: 'email' })
  @IsString()
  @IsEmail()
  @Matches(/^[^\s@]+@udistrital\.edu\.co$/i, { message: 'El correo debe pertenecer a @udistrital.edu.co' })
  email!: string;

  @ApiProperty({ example: 'estudiante_01', minLength: 3, maxLength: 30, pattern: '^[A-Za-z][A-Za-z0-9_]{2,29}$' })
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_]{2,29}$/, { message: 'El apodo debe comenzar con una letra y contener de 3 a 30 letras, números o guiones bajos' })
  nickname!: string;

  @ApiProperty({ example: 'UnaClaveSegura123', minLength: 8, writeOnly: true,
    description: 'Mínimo 8 caracteres y máximo 72 bytes UTF-8.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxPasswordBytes()
  password!: string;

  @ApiProperty({ example: '20231515042', pattern: '^\\d{11}$' })
  @IsString()
  @Matches(/^\d{4}[13]\d{3}(?:00[1-9]|0[1-9]\d|[12]\d{2})$/, { message: 'El código debe tener 11 dígitos, semestre 1 o 3 y consecutivo 001 a 299' })
  studentCode!: string;
}
