import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

export class ConfirmRegistrationDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;
}
