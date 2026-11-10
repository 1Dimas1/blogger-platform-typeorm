import { ApiProperty } from '@nestjs/swagger';
import {
  CreatePostDto,
  CreatePostByBlogIdDto,
} from '../../dto/create-post.dto';
import { IsString } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class CreatePostInputDto implements CreatePostDto {
  @ApiProperty()
  @IsStringWithTrim(1, 30)
  title: string;

  @ApiProperty()
  @IsStringWithTrim(1, 100)
  shortDescription: string;

  @ApiProperty()
  @IsStringWithTrim(1, 1000)
  content: string;

  @ApiProperty()
  @IsString()
  blogId: string;
}

export class CreatePostByBlogIdInputDto implements CreatePostByBlogIdDto {
  @ApiProperty()
  @IsStringWithTrim(1, 30)
  title: string;

  @ApiProperty()
  @IsStringWithTrim(1, 100)
  shortDescription: string;

  @ApiProperty()
  @IsStringWithTrim(1, 1000)
  content: string;
}
