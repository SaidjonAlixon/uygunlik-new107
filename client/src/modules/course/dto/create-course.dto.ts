import { IsString, IsNotEmpty, IsNumber, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  category: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videos?: string[];
}
