import { Injectable } from '@nestjs/common';
import { Like, LikeDocument } from '../../domain/like.entity';
import { CreateLikeDomainDto } from '../../domain/dto/create-like.domain.dto';

@Injectable()
export class LikesFactory {
  create(dto: CreateLikeDomainDto): LikeDocument {
    return Like.createInstance({
      userId: dto.userId,
      parentId: dto.parentId,
      parentType: dto.parentType,
      status: dto.status,
    });
  }
}
