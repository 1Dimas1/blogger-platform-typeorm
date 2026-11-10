import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../../core/decorators/transform/trim';

export class PasswordRecoveryInputDto {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @Trim()
  email: string;
}
