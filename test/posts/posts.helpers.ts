import { PostsRepository } from './posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { postsFactory } from './posts.factory';
import { PostViewDto } from '../../src/modules/blogger-platform/posts/api/view-dto/post.view-dto';
import { CommentViewDto } from '../../src/modules/blogger-platform/comments/api/view-dto/comment.view-dto';
import { CreateCommentInputDto } from '../../src/modules/blogger-platform/comments/api/input-dto/create-comment.input-dto';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { delay } from '../utils/delay';

/**
 * Creates a post with a specified number of comments.
 * Useful for testing nested resource operations.
 *
 * @param postsRepository - Posts repository instance
 * @param blogId - Blog ID for the post
 * @param commentCount - Number of comments to create for the post
 * @param userAccessToken - Access token for authenticated user (for creating comments)
 * @returns Object containing the post and its comments
 *
 * @example
 * const { post, comments } = await createPostWithComments(
 *   postsRepository,
 *   blogId,
 *   5,
 *   userToken
 * );
 */
export async function createPostWithComments(
  blogsRepository: BlogsRepository,
  postsRepository: PostsRepository,
  blogId: string,
  commentCount: number,
  userAccessToken: string,
): Promise<{ post: PostViewDto; comments: CommentViewDto[] }> {
  // Create post
  const post = await postsFactory.createPost(blogsRepository, blogId);

  // Create comments for the post
  const comments: CommentViewDto[] = [];
  for (let i = 0; i < commentCount; i++) {
    const commentData: CreateCommentInputDto = {
      content:
        TEST_HELPERS.createString(
          TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
        ) + ` - Comment ${i + 1}`,
    };

    const comment = await postsRepository.createComment(post.id, commentData, {
      auth: { token: userAccessToken },
    });
    comments.push(comment);

    // Add delay to ensure distinct createdAt timestamps
    if (i < commentCount - 1) {
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
    }
  }

  return { post, comments };
}

/**
 * Creates multiple posts, each with a specified number of comments.
 * Useful for testing pagination and filtering with nested resources.
 *
 * @param postsRepository - Posts repository instance
 * @param blogId - Blog ID for the posts
 * @param postCount - Number of posts to create
 * @param commentsPerPost - Number of comments to create for each post
 * @param userAccessToken - Access token for authenticated user
 * @returns Array of objects, each containing a post and its comments
 *
 * @example
 * const postsWithComments = await createMultiplePostsWithComments(
 *   postsRepository,
 *   blogId,
 *   3,
 *   5,
 *   userToken
 * );
 * // Creates 3 posts, each with 5 comments
 */
export async function createMultiplePostsWithComments(
  blogsRepository: BlogsRepository,
  postsRepository: PostsRepository,
  blogId: string,
  postCount: number,
  commentsPerPost: number,
  userAccessToken: string,
): Promise<Array<{ post: PostViewDto; comments: CommentViewDto[] }>> {
  const postsWithComments: Array<{
    post: PostViewDto;
    comments: CommentViewDto[];
  }> = [];

  for (let i = 0; i < postCount; i++) {
    const { post, comments } = await createPostWithComments(
      blogsRepository,
      postsRepository,
      blogId,
      commentsPerPost,
      userAccessToken,
    );
    postsWithComments.push({ post, comments });

    // Add delay between post creations
    if (i < postCount - 1) {
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
    }
  }

  return postsWithComments;
}
