import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Aarav Sharma', maxLength: 120 })
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'student@example.com' })
  @IsEmail() @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 12, description: 'Use at least 12 characters, including a letter and a number.' })
  @IsString() @MinLength(12) @MaxLength(128) @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password!: string;
}
