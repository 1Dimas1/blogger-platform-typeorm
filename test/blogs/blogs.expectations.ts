import { BlogViewDto } from '../../src/modules/blogger-platform/blogs/api/view-dto/blogs.view-dto';
import { CreateBlogInputDto } from '../../src/modules/blogger-platform/blogs/api/input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from '../../src/modules/blogger-platform/blogs/api/input-dto/update-blog.input-dto';
import { expectValidISODateString } from '../infrastructure/expect-helpers';

/**
 * Validates that a blog has the correct structure and types.
 *
 * @param blog - The blog to validate
 *
 * @example
 * const blog = await blogsRepository.getById(blogId);
 * expectValidBlogShape(blog);
 */
export function expectValidBlogShape(blog: BlogViewDto) {
  expect(blog).toBeDefined();
  expect(typeof blog.id).toBe('string');
  expect(typeof blog.name).toBe('string');
  expect(typeof blog.description).toBe('string');
  expect(typeof blog.websiteUrl).toBe('string');
  expect(typeof blog.isMembership).toBe('boolean');
  expect(typeof blog.createdAt).toBe('string');

  // Validate createdAt is valid ISO date
  expectValidISODateString(blog.createdAt);

  // Validate URL format
  expectBlogUrlFormat(blog.websiteUrl);

  // Validate field lengths
  expect(blog.name.length).toBeGreaterThanOrEqual(1);
  expect(blog.name.length).toBeLessThanOrEqual(15);
  expect(blog.description.length).toBeGreaterThanOrEqual(1);
  expect(blog.description.length).toBeLessThanOrEqual(500);
  expect(blog.websiteUrl.length).toBeGreaterThanOrEqual(1);
  expect(blog.websiteUrl.length).toBeLessThanOrEqual(100);
}

/**
 * Validates that a blog matches the input data used to create/update it.
 *
 * @param blog - The blog to validate
 * @param input - The input data used to create/update the blog
 *
 * @example
 * const input = blogsFactory.createBlogData();
 * const blog = await blogsRepository.create(input);
 * expectBlogToMatchInput(blog, input);
 */
export function expectBlogToMatchInput(
  blog: BlogViewDto,
  input: CreateBlogInputDto | UpdateBlogInputDto,
) {
  expect(blog.name).toBe(input.name);
  expect(blog.description).toBe(input.description);
  expect(blog.websiteUrl).toBe(input.websiteUrl);
}

/**
 * Validates that two blogs have matching properties.
 *
 * @param actual - The actual blog
 * @param expected - The expected blog
 *
 * @example
 * const blog1 = await blogsRepository.getById(id);
 * const blog2 = await blogsRepository.getById(id);
 * expectBlogsToMatch(blog1, blog2);
 */
export function expectBlogsToMatch(actual: BlogViewDto, expected: BlogViewDto) {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.description).toBe(expected.description);
  expect(actual.websiteUrl).toBe(expected.websiteUrl);
  expect(actual.isMembership).toBe(expected.isMembership);
  expect(actual.createdAt).toBe(expected.createdAt);
}

/**
 * Validates that a URL follows the correct HTTPS format.
 * Must start with https:// and have valid domain structure.
 *
 * @param url - The URL to validate
 *
 * @example
 * expectBlogUrlFormat('https://example.com');
 * expectBlogUrlFormat('https://blog.example.com/path');
 */
export function expectBlogUrlFormat(url: string) {
  expect(url).toMatch(/^https:\/\/.+/);

  // Additional validation: should not be HTTP
  expect(url).not.toMatch(/^http:\/\//);

  // Should have valid structure (at least domain)
  const urlPattern =
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;
  expect(url).toMatch(urlPattern);
}
