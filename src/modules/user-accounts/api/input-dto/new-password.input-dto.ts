import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { passwordConstraints } from '../../domain/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';

export class NewPasswordInputDto {
  @ApiProperty()
  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  @Trim()
  newPassword: string;

  @ApiProperty()
  @IsString()
  @Trim()
  recoveryCode: string;
}
