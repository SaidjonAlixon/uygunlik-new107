import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength, ValidateIf } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}
