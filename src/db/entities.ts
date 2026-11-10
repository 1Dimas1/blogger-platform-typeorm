import { User } from '../modules/user-accounts/domain/user.entity';
import { SecurityDevice } from '../modules/user-accounts/domain/security-device.entity';
import { Blog } from '../modules/blogger-platform/blogs/domain/blog.entity';
import { Post } from '../modules/blogger-platform/posts/domain/post.entity';
import { Comment } from '../modules/blogger-platform/comments/domain/comment.entity';
import { PostLike } from '../modules/blogger-platform/likes/domain/post-like.entity';
import { CommentLike } from '../modules/blogger-platform/likes/domain/comment-like.entity';

// every TypeORM entity of the app; used by the app DataSource and the migrations CLI
export const entities = [
  User,
  SecurityDevice,
  Blog,
  Post,
  Comment,
  PostLike,
  CommentLike,
];
