import { CreateCommentInputDto } from '../../src/modules/blogger-platform/comments/api/input-dto/create-comment.input-dto';
import { UpdateCommentInputDto } from '../../src/modules/blogger-platform/comments/api/input-dto/update-comment.input-dto';
import { CommentViewDto } from '../../src/modules/blogger-platform/comments/api/view-dto/comment.view-dto';
import { PostsRepository } from '../posts/posts.repository';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { delay } from '../utils/delay';

/**
 * Factory for creating comment test data.
 * Provides methods for generating valid/invalid comment data and bulk creation utilities.
 */
export const commentsFactory = {
  /**
   * Creates valid comment data with sensible defaults and support for partial overrides.
   *
   * @param overrides - Partial comment data to override defaults
   * @returns Complete CreateCommentInputDto with defaults applied
   *
   * @example
   * const commentData = commentsFactory.createCommentData();
   *
   * @example
   * const commentData = commentsFactory.createCommentData({
   *   content: 'Custom comment content with sufficient length for validation',
   * });
   */
  createCommentData(
    overrides: Partial<CreateCommentInputDto> = {},
  ): CreateCommentInputDto {
    const timestamp = Date.now();
    const defaultContent = `Valid comment content for testing purposes - timestamp ${timestamp}`;

    return {
      content:
        overrides.content ??
        defaultContent.substring(
          0,
          TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
        ),
    };
  },

  /**
   * Creates valid update comment data.
   *
   * @param overrides - Partial update data to override defaults
   * @returns Complete UpdateCommentInputDto
   *
   * @example
   * const updateData = commentsFactory.createUpdateCommentData({
   *   content: 'Updated content with sufficient length for validation rules',
   * });
   */
  createUpdateCommentData(
    overrides: Partial<UpdateCommentInputDto> = {},
  ): UpdateCommentInputDto {
    const timestamp = Date.now();
    const defaultContent = `Updated comment content for testing - timestamp ${timestamp}`;

    return {
      content:
        overrides.content ??
        defaultContent.substring(
          0,
          TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
        ),
    };
  },

  /**
   * Creates comment data that will fail validation.
   * Useful for testing validation error responses.
   *
   * @returns CreateCommentInputDto with invalid values
   *
   * @example
   * const invalidData = commentsFactory.createInvalidCommentData();
   * await postsRepository.createComment(postId, invalidData, { statusCode: 400 });
   */
  createInvalidCommentData(): CreateCommentInputDto {
    return {
      content: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX + 1,
      ), // Too long
    };
  },

  /**
   * Creates comment data with minimum valid content (20 chars).
   *
   * @param overrides - Partial comment data to override defaults
   * @returns CreateCommentInputDto with minimum content
   *
   * @example
   * const data = commentsFactory.createCommentDataWithMinContent();
   */
  createCommentDataWithMinContent(
    overrides: Partial<CreateCommentInputDto> = {},
  ): CreateCommentInputDto {
    return this.createCommentData({
      ...overrides,
      content: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
      ),
    });
  },

  /**
   * Creates comment data with maximum valid content (300 chars).
   *
   * @param overrides - Partial comment data to override defaults
   * @returns CreateCommentInputDto with maximum content
   *
   * @example
   * const data = commentsFactory.createCommentDataWithMaxContent();
   */
  createCommentDataWithMaxContent(
    overrides: Partial<CreateCommentInputDto> = {},
  ): CreateCommentInputDto {
    return this.createCommentData({
      ...overrides,
      content: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
      ),
    });
  },

  /**
   * Creates comment data with content that's too short (below minimum).
   *
   * @param overrides - Partial comment data to override defaults
   * @returns CreateCommentInputDto with invalid content
   *
   * @example
   * const data = commentsFactory.createCommentDataWithTooShortContent();
   */
  createCommentDataWithTooShortContent(
    overrides: Partial<CreateCommentInputDto> = {},
  ): CreateCommentInputDto {
    return this.createCommentData({
      ...overrides,
      content: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN - 1,
      ),
    });
  },

  /**
   * Creates comment data with content that's too long (above maximum).
   *
   * @param overrides - Partial comment data to override defaults
   * @returns CreateCommentInputDto with invalid content
   *
   * @example
   * const data = commentsFactory.createCommentDataWithTooLongContent();
   */
  createCommentDataWithTooLongContent(
    overrides: Partial<CreateCommentInputDto> = {},
  ): CreateCommentInputDto {
    return this.createCommentData({
      ...overrides,
      content: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX + 1,
      ),
    });
  },

  /**
   * Creates comment data with empty content.
   *
   * @param overrides - Partial comment data to override defaults
   * @returns CreateCommentInputDto with invalid content
   *
   * @example
   * const data = commentsFactory.createCommentDataWithEmptyContent();
   */
  createCommentDataWithEmptyContent(
    overrides: Partial<CreateCommentInputDto> = {},
  ): CreateCommentInputDto {
    return this.createCommentData({
      ...overrides,
      content: '',
    });
  },

  /**
   * Creates comment data with whitespace content to test trimming.
   *
   * @param overrides - Partial comment data to override defaults
   * @returns CreateCommentInputDto with whitespace content
   *
   * @example
   * const data = commentsFactory.createCommentDataWithWhitespace();
   */
  createCommentDataWithWhitespace(
    overrides: Partial<CreateCommentInputDto> = {},
  ): CreateCommentInputDto {
    const validContent = TEST_HELPERS.createString(
      TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
    );
    return this.createCommentData({
      ...overrides,
      content: `  ${validContent}  `, // Leading and trailing whitespace
    });
  },

  /**
   * Creates a comment via the PostsRepository.
   * Note: Comments are created via nested endpoint POST /posts/:postId/comments
   *
   * @param postsRepository - Posts repository instance
   * @param postId - Post ID to create comment for
   * @param accessToken - User access token for authentication
   * @param overrides - Partial comment data to override defaults
   * @returns Created comment view DTO
   *
   * @example
   * const comment = await commentsFactory.createComment(
   *   postsRepository,
   *   postId,
   *   userToken
   * );
   *
   * @example
   * const comment = await commentsFactory.createComment(
   *   postsRepository,
   *   postId,
   *   userToken,
   *   { content: 'Custom content here with sufficient length' }
   * );
   */
  async createComment(
    postsRepository: PostsRepository,
    postId: string,
    accessToken: string,
    overrides: Partial<CreateCommentInputDto> = {},
  ): Promise<CommentViewDto> {
    const commentData = this.createCommentData(overrides);
    return postsRepository.createComment(postId, commentData, {
      auth: { token: accessToken },
    });
  },

  /**
   * Creates multiple comments via the PostsRepository with delays between creations.
   * The delays ensure distinct createdAt timestamps for reliable sorting tests.
   *
   * @param count - Number of comments to create
   * @param postsRepository - Posts repository instance
   * @param postId - Post ID to create comments for
   * @param accessToken - User access token for authentication
   * @param baseOverrides - Base overrides applied to all comments
   * @returns Array of created comment view DTOs
   *
   * @example
   * const comments = await commentsFactory.createMultipleComments(
   *   10,
   *   postsRepository,
   *   postId,
   *   userToken
   * );
   */
  async createMultipleComments(
    count: number,
    postsRepository: PostsRepository,
    postId: string,
    accessToken: string,
    baseOverrides: Partial<CreateCommentInputDto> = {},
  ): Promise<CommentViewDto[]> {
    const comments: CommentViewDto[] = [];

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const comment = await this.createComment(
        postsRepository,
        postId,
        accessToken,
        {
          ...baseOverrides,
          content: baseOverrides.content
            ? `${baseOverrides.content} ${i}`.substring(
                0,
                TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
              )
            : `Comment ${i} - timestamp ${timestamp}`.substring(
                0,
                TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
              ),
        },
      );

      comments.push(comment);

      // Add delay to ensure distinct createdAt timestamps for sorting tests
      if (i < count - 1) {
        await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      }
    }

    return comments;
  },
};
