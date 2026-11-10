import { CreateBlogInputDto } from '../../src/modules/blogger-platform/blogs/api/input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from '../../src/modules/blogger-platform/blogs/api/input-dto/update-blog.input-dto';
import { CreatePostByBlogIdInputDto } from '../../src/modules/blogger-platform/posts/api/input-dto/create-post.input-dto';
import { BlogViewDto } from '../../src/modules/blogger-platform/blogs/api/view-dto/blogs.view-dto';
import { BlogsRepository } from './blogs.repository';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { delay } from '../utils/delay';

/**
 * Factory for creating blog test data.
 * Provides methods for generating valid/invalid blog data and bulk creation utilities.
 */
export const blogsFactory = {
  /**
   * Creates valid blog data with sensible defaults and support for partial overrides.
   *
   * @param overrides - Partial blog data to override defaults
   * @returns Complete CreateBlogInputDto with defaults applied
   *
   * @example
   * // With defaults
   * const blogData = blogsFactory.createBlogData();
   *
   * @example
   * // With overrides
   * const blogData = blogsFactory.createBlogData({
   *   name: 'Tech Blog',
   *   description: 'A blog about technology',
   * });
   */
  createBlogData(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    const timestamp = Date.now();
    return {
      name:
        overrides.name ??
        `Blog${timestamp.toString().slice(-8)}`.substring(0, 15),
      description: overrides.description ?? `Description for blog ${timestamp}`,
      websiteUrl:
        overrides.websiteUrl ??
        TEST_HELPERS.createWebsiteUrl(`blog${timestamp}.com`),
    };
  },

  /**
   * Creates blog data that will fail validation.
   * Useful for testing validation error responses.
   *
   * @returns CreateBlogInputDto with invalid values
   *
   * @example
   * const invalidData = blogsFactory.createInvalidBlogData();
   * await blogsRepository.create(invalidData, { statusCode: 400 });
   */
  createInvalidBlogData(): CreateBlogInputDto {
    return {
      name: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.BLOG.NAME_MAX + 1,
      ), // Too long
      description: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.BLOG.DESCRIPTION_MAX + 1,
      ), // Too long
      websiteUrl: 'http://invalid-protocol.com', // HTTP instead of HTTPS
    };
  },

  /**
   * Creates blog data with minimum valid name (1 char).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with minimum name
   *
   * @example
   * const data = blogsFactory.createBlogDataWithShortName();
   */
  createBlogDataWithShortName(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    return this.createBlogData({
      ...overrides,
      name: TEST_HELPERS.createString(TEST_CONSTANTS.VALIDATION.BLOG.NAME_MIN),
    });
  },

  /**
   * Creates blog data with maximum valid name (15 chars).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with maximum name
   *
   * @example
   * const data = blogsFactory.createBlogDataWithLongName();
   */
  createBlogDataWithLongName(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    return this.createBlogData({
      ...overrides,
      name: TEST_HELPERS.createString(TEST_CONSTANTS.VALIDATION.BLOG.NAME_MAX),
    });
  },

  /**
   * Creates blog data with name that's too long (above maximum).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with invalid name
   *
   * @example
   * const data = blogsFactory.createBlogDataWithTooLongName();
   */
  createBlogDataWithTooLongName(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    return this.createBlogData({
      ...overrides,
      name: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.BLOG.NAME_MAX + 1,
      ),
    });
  },

  /**
   * Creates blog data with name that's too short (below minimum).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with invalid name
   *
   * @example
   * const data = blogsFactory.createBlogDataWithEmptyName();
   */
  createBlogDataWithEmptyName(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    return this.createBlogData({
      ...overrides,
      name: '',
    });
  },

  /**
   * Creates blog data with description that's too long (above maximum).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with invalid description
   *
   * @example
   * const data = blogsFactory.createBlogDataWithTooLongDescription();
   */
  createBlogDataWithTooLongDescription(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    return this.createBlogData({
      ...overrides,
      description: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.BLOG.DESCRIPTION_MAX + 1,
      ),
    });
  },

  /**
   * Creates blog data with description that's too short (below minimum).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with invalid description
   *
   * @example
   * const data = blogsFactory.createBlogDataWithEmptyDescription();
   */
  createBlogDataWithEmptyDescription(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    return this.createBlogData({
      ...overrides,
      description: '',
    });
  },

  /**
   * Creates blog data with invalid URL format (HTTP instead of HTTPS).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with invalid URL
   *
   * @example
   * const data = blogsFactory.createBlogDataWithHttpUrl();
   */
  createBlogDataWithHttpUrl(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    return this.createBlogData({
      ...overrides,
      websiteUrl: 'http://example.com',
    });
  },

  /**
   * Creates blog data with URL that's too long (above maximum).
   *
   * @param overrides - Partial blog data to override defaults
   * @returns CreateBlogInputDto with invalid URL
   *
   * @example
   * const data = blogsFactory.createBlogDataWithTooLongUrl();
   */
  createBlogDataWithTooLongUrl(
    overrides: Partial<CreateBlogInputDto> = {},
  ): CreateBlogInputDto {
    const longDomain = TEST_HELPERS.createString(90);
    return this.createBlogData({
      ...overrides,
      websiteUrl: `https://${longDomain}.com`,
    });
  },

  /**
   * Creates valid update blog data.
   *
   * @param overrides - Partial update data to override defaults
   * @returns Complete UpdateBlogInputDto
   *
   * @example
   * const updateData = blogsFactory.createUpdateBlogData({ name: 'New Name' });
   */
  createUpdateBlogData(
    overrides: Partial<UpdateBlogInputDto> = {},
  ): UpdateBlogInputDto {
    const timestamp = Date.now();
    return {
      name:
        overrides.name ??
        `Updated${timestamp.toString().slice(-6)}`.substring(0, 15),
      description: overrides.description ?? `Updated description ${timestamp}`,
      websiteUrl:
        overrides.websiteUrl ??
        TEST_HELPERS.createWebsiteUrl(`updated${timestamp}.com`),
    };
  },

  /**
   * Creates valid post data for a blog.
   *
   * @param overrides - Partial post data to override defaults
   * @returns Complete CreatePostByBlogIdInputDto
   *
   * @example
   * const postData = blogsFactory.createPostData();
   */
  createPostData(
    overrides: Partial<CreatePostByBlogIdInputDto> = {},
  ): CreatePostByBlogIdInputDto {
    const timestamp = Date.now();
    return {
      title: overrides.title ?? `Post Title ${timestamp}`.substring(0, 30),
      shortDescription:
        overrides.shortDescription ??
        `Short description ${timestamp}`.substring(0, 100),
      content: overrides.content ?? `Post content ${timestamp}`,
    };
  },

  /**
   * Creates a blog via the repository.
   *
   * @param repository - Blogs repository instance
   * @param overrides - Partial blog data to override defaults
   * @returns Created blog view DTO
   *
   * @example
   * const blog = await blogsFactory.createBlog(blogsRepository);
   *
   * @example
   * const blog = await blogsFactory.createBlog(blogsRepository, {
   *   name: 'Tech Blog',
   *   description: 'A blog about technology',
   * });
   */
  async createBlog(
    repository: BlogsRepository,
    overrides: Partial<CreateBlogInputDto> = {},
  ): Promise<BlogViewDto> {
    const blogData = this.createBlogData(overrides);
    return repository.create(blogData);
  },

  /**
   * Creates multiple blogs via the repository with delays between creations.
   * The delays ensure distinct createdAt timestamps for reliable sorting tests.
   *
   * @param count - Number of blogs to create
   * @param repository - Blogs repository instance
   * @param baseOverrides - Base overrides applied to all blogs
   * @returns Array of created blog view DTOs
   *
   * @example
   * const blogs = await blogsFactory.createMultipleBlogs(10, blogsRepository);
   */
  async createMultipleBlogs(
    count: number,
    repository: BlogsRepository,
    baseOverrides: Partial<CreateBlogInputDto> = {},
  ): Promise<BlogViewDto[]> {
    const blogs: BlogViewDto[] = [];

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const blog = await this.createBlog(repository, {
        ...baseOverrides,
        name: baseOverrides.name
          ? `${baseOverrides.name}${i}`.substring(0, 15)
          : `Blog${i}_${timestamp}`.substring(0, 15),
        description: baseOverrides.description
          ? `${baseOverrides.description} ${i}`
          : `Description for blog ${i} - ${timestamp}`,
        websiteUrl: baseOverrides.websiteUrl
          ? baseOverrides.websiteUrl
          : TEST_HELPERS.createWebsiteUrl(`blog${i}-${timestamp}.com`),
      });

      blogs.push(blog);

      // Add delay to ensure distinct createdAt timestamps for sorting tests
      if (i < count - 1) {
        await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      }
    }

    return blogs;
  },
};
