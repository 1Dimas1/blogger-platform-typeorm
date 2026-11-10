import { IsEmail, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { emailConstraints } from '../../domain/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';

export class RegistrationEmailResendingInputDto {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @Matches(emailConstraints.match)
  @Trim()
  email: string;
}
