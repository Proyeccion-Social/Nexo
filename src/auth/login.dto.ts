import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { MaxPasswordBytes } from './max-password-bytes.decorator.js';

export class LoginDto {
  @ApiProperty({ example: 'estudiante@udistrital.edu.co', format: 'email' })
  @IsString()
  @IsEmail()
  @Matches(/^[^\s@]+@udistrital\.edu\.co$/i)
  email!: string;

  @ApiProperty({ writeOnly: true, description: 'Máximo 72 bytes UTF-8.' })
  @IsString()
  @IsNotEmpty()
  @MaxPasswordBytes()
  password!: string;
}
