import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'estudiante@udistrital.edu.co', format: 'email' })
  @IsString()
  @IsEmail()
  @Matches(/^[^\s@]+@udistrital\.edu\.co$/i)
  email!: string;

  @ApiProperty({ writeOnly: true })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
