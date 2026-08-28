import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsIn(['email', 'phone'])
  type: 'email' | 'phone';
}
