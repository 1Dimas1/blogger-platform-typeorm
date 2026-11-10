import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../../core/decorators/transform/trim';

export class LoginInputDto {
  @ApiProperty({ example: 'user123 or user@example.com' })
  @IsString()
  @IsNotEmpty()
  @Trim()
  loginOrEmail: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
