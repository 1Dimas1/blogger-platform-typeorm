import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../../core/decorators/transform/trim';

export class RegistrationConfirmationInputDto {
  @ApiProperty()
  @IsString()
  @Trim()
  code: string;
}
