import { CreatePostByBlogIdInputDto } from '../../src/modules/blogger-platform/posts/api/input-dto/create-post.input-dto';
import { UpdatePostInputDto } from '../../src/modules/blogger-platform/posts/api/input-dto/update-post.input-dto';
import { PostViewDto } from '../../src/modules/blogger-platform/posts/api/view-dto/post.view-dto';
import { BlogsRepository } from '../blogs/blogs.repository';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { delay } from '../utils/delay';

/**
 * Factory for creating post test data.
 * Provides methods for generating valid/invalid post data and bulk creation utilities.
 */
export const postsFactory = {
  /**
   * Creates valid post data with sensible defaults and support for partial overrides.
   *
   * @param blogId - Blog ID for the post (required)
   * @param overrides - Partial post data to override defaults
   * @returns Complete CreatePostInputDto with defaults applied
   *
   * @example
   * // With required blogId
   * const postData = postsFactory.createPostData(blogId);
   *
   * @example
   * // With overrides
   * const postData = postsFactory.createPostData(blogId, {
   *   title: 'Custom Title',
   *   content: 'Custom content',
   * });
   */
  createPostData(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    const timestamp = Date.now();
    return {
      title:
        overrides.title ??
        `Post ${timestamp.toString().slice(-6)}`.substring(0, 30),
      shortDescription:
        overrides.shortDescription ??
        `Description ${timestamp}`.substring(0, 100),
      content: overrides.content ?? `Content for post ${timestamp}`,
    };
  },

  /**
   * Creates post data that will fail validation.
   * Useful for testing validation error responses.
   *
   * @param blogId - Blog ID for the post
   * @returns CreatePostInputDto with invalid values
   *
   * @example
   * const invalidData = postsFactory.createInvalidPostData(blogId);
   * await postsRepository.create(invalidData, { statusCode: 400 });
   */
  createInvalidPostData(blogId: string): CreatePostByBlogIdInputDto {
    return {
      title: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.TITLE_MAX + 1,
      ), // Too long
      shortDescription: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.SHORT_DESCRIPTION_MAX + 1,
      ), // Too long
      content: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.CONTENT_MAX + 1,
      ), // Too long
    };
  },

  /**
   * Creates post data with minimum valid title (1 char).
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with minimum title
   */
  createPostDataWithShortTitle(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      title: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.TITLE_MIN,
      ),
    });
  },

  /**
   * Creates post data with maximum valid title (30 chars).
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with maximum title
   */
  createPostDataWithLongTitle(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      title: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.TITLE_MAX,
      ),
    });
  },

  /**
   * Creates post data with title that's too long (above maximum).
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with invalid title
   */
  createPostDataWithTooLongTitle(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      title: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.TITLE_MAX + 1,
      ),
    });
  },

  /**
   * Creates post data with empty title.
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with invalid title
   */
  createPostDataWithEmptyTitle(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      title: '',
    });
  },

  /**
   * Creates post data with shortDescription that's too long (above maximum).
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with invalid shortDescription
   */
  createPostDataWithTooLongShortDescription(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      shortDescription: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.SHORT_DESCRIPTION_MAX + 1,
      ),
    });
  },

  /**
   * Creates post data with empty shortDescription.
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with invalid shortDescription
   */
  createPostDataWithEmptyShortDescription(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      shortDescription: '',
    });
  },

  /**
   * Creates post data with content that's too long (above maximum).
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with invalid content
   */
  createPostDataWithTooLongContent(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      content: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.POST.CONTENT_MAX + 1,
      ),
    });
  },

  /**
   * Creates post data with empty content.
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns CreatePostInputDto with invalid content
   */
  createPostDataWithEmptyContent(
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    return this.createPostData(blogId, {
      ...overrides,
      content: '',
    });
  },

  /**
   * Creates valid update post data.
   *
   * @param blogId - Blog ID for the post
   * @param overrides - Partial update data to override defaults
   * @returns Complete UpdatePostInputDto
   *
   * @example
   * const updateData = postsFactory.createUpdatePostData(blogId, { title: 'New Title' });
   */
  createUpdatePostData(
    blogId: string,
    overrides: Partial<UpdatePostInputDto> = {},
  ): UpdatePostInputDto {
    const timestamp = Date.now();
    return {
      title:
        overrides.title ??
        `Updated ${timestamp.toString().slice(-5)}`.substring(0, 30),
      shortDescription:
        overrides.shortDescription ?? `Updated description ${timestamp}`,
      content: overrides.content ?? `Updated content ${timestamp}`,
      blogId: overrides.blogId ?? blogId,
    };
  },

  /**
   * Creates a post via the repository.
   *
   * @param repository - Posts repository instance
   * @param blogId - Blog ID for the post
   * @param overrides - Partial post data to override defaults
   * @returns Created post view DTO
   *
   * @example
   * const post = await postsFactory.createPost(postsRepository, blogId);
   *
   * @example
   * const post = await postsFactory.createPost(postsRepository, blogId, {
   *   title: 'Custom Title',
   * });
   */
  async createPost(
    repository: BlogsRepository,
    blogId: string,
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): Promise<PostViewDto> {
    const postData = this.createPostData(blogId, overrides);
    return repository.createPost(blogId, postData);
  },

  /**
   * Creates multiple posts via the repository with delays between creations.
   * The delays ensure distinct createdAt timestamps for reliable sorting tests.
   *
   * @param count - Number of posts to create
   * @param repository - Posts repository instance
   * @param blogId - Blog ID for the posts
   * @param baseOverrides - Base overrides applied to all posts
   * @returns Array of created post view DTOs
   *
   * @example
   * const posts = await postsFactory.createMultiplePosts(10, postsRepository, blogId);
   */
  async createMultiplePosts(
    count: number,
    repository: BlogsRepository,
    blogId: string,
    baseOverrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): Promise<PostViewDto[]> {
    const posts: PostViewDto[] = [];

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const post = await this.createPost(repository, blogId, {
        ...baseOverrides,
        title: baseOverrides.title
          ? `${baseOverrides.title} ${i}`.substring(0, 30)
          : `Post ${i}_${timestamp}`.substring(0, 30),
        shortDescription: baseOverrides.shortDescription
          ? `${baseOverrides.shortDescription} ${i}`
          : `Description for post ${i} - ${timestamp}`,
        content: baseOverrides.content
          ? `${baseOverrides.content} ${i}`
          : `Content for post ${i} - ${timestamp}`,
      });

      posts.push(post);

      // Add delay to ensure distinct createdAt timestamps for sorting tests
      if (i < count - 1) {
        await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      }
    }

    return posts;
  },
};
