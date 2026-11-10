import { CreateUserDto } from '../../dto/create-user.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  emailConstraints,
  loginConstraints,
  passwordConstraints,
} from '../../domain/user.entity';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';
import { Trim } from '../../../../core/decorators/transform/trim';

export class CreateUserInputDto implements CreateUserDto {
  @ApiProperty({ example: 'user123' })
  @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
  @Matches(loginConstraints.match, {
    message:
      'Login must contain only letters, numbers, underscores, and hyphens',
  })
  login: string;

  @ApiProperty({ example: 'password123' })
  @IsString({ message: 'Password must be a string' })
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength, {
    message: `Password must be between ${passwordConstraints.minLength} and ${passwordConstraints.maxLength} characters`,
  })
  @Trim()
  password: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Matches(emailConstraints.match, { message: 'Invalid email format' })
  @Trim()
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  // TODO create first name constraints
  @Length(1, 50, { message: 'First name must be between 1 and 50 characters' })
  @Trim()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  // TODO create last name constraints
  @Length(1, 50, { message: 'Last name must be between 1 and 50 characters' })
  @Trim()
  lastName?: string;
}
