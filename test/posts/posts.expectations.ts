import { PostViewDto } from '../../src/modules/blogger-platform/posts/api/view-dto/post.view-dto';
import { CreatePostInputDto } from '../../src/modules/blogger-platform/posts/api/input-dto/create-post.input-dto';
import { UpdatePostInputDto } from '../../src/modules/blogger-platform/posts/api/input-dto/update-post.input-dto';
import { LikeStatus } from '../../src/modules/blogger-platform/likes/domain/like.entity';
import { expectValidISODateString } from '../infrastructure/expect-helpers';

/**
 * Validates that a post has the correct structure and types.
 *
 * @param post - The post to validate
 *
 * @example
 * const post = await postsRepository.getById(postId);
 * expectValidPostShape(post);
 */
export function expectValidPostShape(post: PostViewDto) {
  expect(post).toBeDefined();
  expect(typeof post.id).toBe('string');
  expect(typeof post.title).toBe('string');
  expect(typeof post.shortDescription).toBe('string');
  expect(typeof post.content).toBe('string');
  expect(typeof post.blogId).toBe('string');
  expect(typeof post.blogName).toBe('string');
  expect(post.createdAt).toBeDefined();

  // Validate extendedLikesInfo structure
  expect(post.extendedLikesInfo).toBeDefined();
  expect(typeof post.extendedLikesInfo.likesCount).toBe('number');
  expect(typeof post.extendedLikesInfo.dislikesCount).toBe('number');
  expect(Object.values(LikeStatus)).toContain(post.extendedLikesInfo.myStatus);
  expect(Array.isArray(post.extendedLikesInfo.newestLikes)).toBe(true);

  // Validate newestLikes structure
  post.extendedLikesInfo.newestLikes.forEach((like) => {
    expect(typeof like.addedAt).toBe('string');
    expectValidISODateString(like.addedAt);
    expect(typeof like.userId).toBe('string');
    expect(typeof like.login).toBe('string');
  });

  // Validate field lengths
  expect(post.title.length).toBeGreaterThanOrEqual(1);
  expect(post.title.length).toBeLessThanOrEqual(30);
  expect(post.shortDescription.length).toBeGreaterThanOrEqual(1);
  expect(post.shortDescription.length).toBeLessThanOrEqual(100);
  expect(post.content.length).toBeGreaterThanOrEqual(1);
  expect(post.content.length).toBeLessThanOrEqual(1000);
}

/**
 * Validates that a post matches the input data used to create/update it.
 *
 * @param post - The post to validate
 * @param input - The input data used to create/update the post
 *
 * @example
 * const input = postsFactory.createPostData(blogId);
 * const post = await postsRepository.create(input);
 * expectPostToMatchInput(post, input);
 */
export function expectPostToMatchInput(
  post: PostViewDto,
  input: CreatePostInputDto | UpdatePostInputDto,
) {
  expect(post.title).toBe(input.title);
  expect(post.shortDescription).toBe(input.shortDescription);
  expect(post.content).toBe(input.content);
  expect(post.blogId).toBe(input.blogId);
}

/**
 * Validates that two posts have matching properties.
 *
 * @param actual - The actual post
 * @param expected - The expected post
 *
 * @example
 * const post1 = await postsRepository.getById(id);
 * const post2 = await postsRepository.getById(id);
 * expectPostsToMatch(post1, post2);
 */
export function expectPostsToMatch(actual: PostViewDto, expected: PostViewDto) {
  expect(actual.id).toBe(expected.id);
  expect(actual.title).toBe(expected.title);
  expect(actual.shortDescription).toBe(expected.shortDescription);
  expect(actual.content).toBe(expected.content);
  expect(actual.blogId).toBe(expected.blogId);
  expect(actual.blogName).toBe(expected.blogName);
  expect(actual.createdAt).toEqual(expected.createdAt);
}

/**
 * Validates that the extendedLikesInfo has correct initial values.
 *
 * @param post - The post to validate
 *
 * @example
 * const post = await postsRepository.create(postData);
 * expectInitialLikesInfo(post);
 */
export function expectInitialLikesInfo(post: PostViewDto) {
  expect(post.extendedLikesInfo.likesCount).toBe(0);
  expect(post.extendedLikesInfo.dislikesCount).toBe(0);
  expect(post.extendedLikesInfo.myStatus).toBe(LikeStatus.None);
  expect(post.extendedLikesInfo.newestLikes).toHaveLength(0);
}

/**
 * Validates that the extendedLikesInfo has correct counts.
 *
 * @param post - The post to validate
 * @param expectedLikes - Expected likes count
 * @param expectedDislikes - Expected dislikes count
 *
 * @example
 * expectLikesCounts(post, 5, 2);
 */
export function expectLikesCounts(
  post: PostViewDto,
  expectedLikes: number,
  expectedDislikes: number,
) {
  expect(post.extendedLikesInfo.likesCount).toBe(expectedLikes);
  expect(post.extendedLikesInfo.dislikesCount).toBe(expectedDislikes);
}

/**
 * Validates that the post has the correct myStatus for the current user.
 *
 * @param post - The post to validate
 * @param expectedStatus - Expected like status
 *
 * @example
 * expectMyStatus(post, LikeStatus.Like);
 */
export function expectMyStatus(post: PostViewDto, expectedStatus: LikeStatus) {
  expect(post.extendedLikesInfo.myStatus).toBe(expectedStatus);
}

/**
 * Validates that newestLikes contains expected number of likes and they are sorted by date descending.
 *
 * @param post - The post to validate
 * @param expectedCount - Expected number of newest likes (max 3)
 *
 * @example
 * expectNewestLikesCount(post, 3);
 */
export function expectNewestLikesCount(
  post: PostViewDto,
  expectedCount: number,
) {
  expect(post.extendedLikesInfo.newestLikes).toHaveLength(expectedCount);

  // Verify they are sorted by addedAt descending (newest first)
  if (expectedCount > 1) {
    for (let i = 0; i < expectedCount - 1; i++) {
      const current = new Date(
        post.extendedLikesInfo.newestLikes[i].addedAt,
      ).getTime();
      const next = new Date(
        post.extendedLikesInfo.newestLikes[i + 1].addedAt,
      ).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  }
}
