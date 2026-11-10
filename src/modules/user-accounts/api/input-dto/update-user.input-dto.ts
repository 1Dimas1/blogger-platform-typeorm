import { IsEmail } from 'class-validator';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserInputDto implements UpdateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
