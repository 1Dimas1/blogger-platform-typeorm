import { ApiProperty } from '@nestjs/swagger';

export class BlogViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  websiteUrl: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  isMembership: boolean;

  static mapToView(row: any): BlogViewDto {
    const dto = new BlogViewDto();

    dto.id = row.id;
    dto.name = row.name;
    dto.description = row.description;
    dto.websiteUrl = row.website_url ?? row.websiteUrl;
    dto.createdAt = new Date(row.created_at ?? row.createdAt).toISOString();
    dto.isMembership = row.is_membership ?? row.isMembership;

    return dto;
  }
}
