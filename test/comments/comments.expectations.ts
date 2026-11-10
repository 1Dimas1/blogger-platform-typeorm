import { CommentViewDto } from '../../src/modules/blogger-platform/comments/api/view-dto/comment.view-dto';
import { CreateCommentInputDto } from '../../src/modules/blogger-platform/comments/api/input-dto/create-comment.input-dto';
import { UpdateCommentInputDto } from '../../src/modules/blogger-platform/comments/api/input-dto/update-comment.input-dto';
import { LikeStatus } from '../../src/modules/blogger-platform/likes/domain/like.entity';
import { expectValidISODateString } from '../infrastructure/expect-helpers';

/**
 * Validates that a comment has the correct structure and types.
 *
 * @param comment - The comment to validate
 *
 * @example
 * const comment = await commentsRepository.getById(commentId);
 * expectValidCommentShape(comment);
 */
export function expectValidCommentShape(comment: CommentViewDto) {
  expect(comment).toBeDefined();
  expect(typeof comment.id).toBe('string');
  expect(typeof comment.content).toBe('string');
  expect(comment.createdAt).toBeDefined();
  expectValidISODateString(comment.createdAt as any);

  // Validate commentatorInfo structure
  expect(comment.commentatorInfo).toBeDefined();
  expect(typeof comment.commentatorInfo.userId).toBe('string');
  expect(typeof comment.commentatorInfo.userLogin).toBe('string');

  // Validate likesInfo structure
  expect(comment.likesInfo).toBeDefined();
  expect(typeof comment.likesInfo.likesCount).toBe('number');
  expect(typeof comment.likesInfo.dislikesCount).toBe('number');
  expect(Object.values(LikeStatus)).toContain(comment.likesInfo.myStatus);

  // Validate content length (20-300 chars)
  expect(comment.content.length).toBeGreaterThanOrEqual(20);
  expect(comment.content.length).toBeLessThanOrEqual(300);
}

/**
 * Validates that a comment matches the input data used to create it.
 *
 * @param comment - The comment to validate
 * @param input - The input data used to create the comment
 *
 * @example
 * const input = commentsFactory.createCommentData();
 * const comment = await postsRepository.createComment(postId, input, { auth: { token } });
 * expectCommentToMatchInput(comment, input);
 */
export function expectCommentToMatchInput(
  comment: CommentViewDto,
  input: CreateCommentInputDto | UpdateCommentInputDto,
) {
  // Content should match after trimming
  expect(comment.content).toBe(input.content.trim());
}

/**
 * Validates that two comments have matching properties.
 *
 * @param actual - The actual comment
 * @param expected - The expected comment
 *
 * @example
 * const comment1 = await commentsRepository.getById(id);
 * const comment2 = await commentsRepository.getById(id);
 * expectCommentsToMatch(comment1, comment2);
 */
export function expectCommentsToMatch(
  actual: CommentViewDto,
  expected: CommentViewDto,
) {
  expect(actual.id).toBe(expected.id);
  expect(actual.content).toBe(expected.content);
  expect(actual.commentatorInfo.userId).toBe(expected.commentatorInfo.userId);
  expect(actual.commentatorInfo.userLogin).toBe(
    expected.commentatorInfo.userLogin,
  );
  expect(actual.createdAt).toEqual(expected.createdAt);
}

/**
 * Validates comment's commentatorInfo.
 *
 * @param comment - The comment to validate
 * @param expectedUserId - Expected user ID (optional)
 * @param expectedLogin - Expected user login (optional)
 *
 * @example
 * expectValidCommentatorInfo(comment, userId, userLogin);
 */
export function expectValidCommentatorInfo(
  comment: CommentViewDto,
  expectedUserId?: string,
  expectedLogin?: string,
) {
  expect(comment.commentatorInfo).toBeDefined();
  expect(comment.commentatorInfo.userId).toBeDefined();
  expect(comment.commentatorInfo.userLogin).toBeDefined();

  if (expectedUserId) {
    expect(comment.commentatorInfo.userId).toBe(expectedUserId);
  }

  if (expectedLogin) {
    expect(comment.commentatorInfo.userLogin).toBe(expectedLogin);
  }
}

/**
 * Validates that comment content is within expected length bounds.
 *
 * @param comment - The comment to validate
 * @param min - Minimum expected length
 * @param max - Maximum expected length
 *
 * @example
 * expectContentLength(comment, 20, 300);
 */
export function expectContentLength(
  comment: CommentViewDto,
  min: number,
  max: number,
) {
  expect(comment.content.length).toBeGreaterThanOrEqual(min);
  expect(comment.content.length).toBeLessThanOrEqual(max);
}

/**
 * Validates that the likesInfo has correct initial values.
 *
 * @param comment - The comment to validate
 *
 * @example
 * const comment = await postsRepository.createComment(postId, data, { auth: { token } });
 * expectInitialLikesInfo(comment);
 */
export function expectInitialLikesInfo(comment: CommentViewDto) {
  expect(comment.likesInfo.likesCount).toBe(0);
  expect(comment.likesInfo.dislikesCount).toBe(0);
  expect(comment.likesInfo.myStatus).toBe(LikeStatus.None);
}

/**
 * Validates that the likesInfo has correct counts.
 *
 * @param comment - The comment to validate
 * @param expectedLikes - Expected likes count
 * @param expectedDislikes - Expected dislikes count
 *
 * @example
 * expectLikesCounts(comment, 5, 2);
 */
export function expectLikesCounts(
  comment: CommentViewDto,
  expectedLikes: number,
  expectedDislikes: number,
) {
  expect(comment.likesInfo.likesCount).toBe(expectedLikes);
  expect(comment.likesInfo.dislikesCount).toBe(expectedDislikes);
}

/**
 * Validates that the comment has the correct myStatus for the current user.
 *
 * @param comment - The comment to validate
 * @param expectedStatus - Expected like status
 *
 * @example
 * expectMyStatus(comment, LikeStatus.Like);
 */
export function expectMyStatus(
  comment: CommentViewDto,
  expectedStatus: LikeStatus,
) {
  expect(comment.likesInfo.myStatus).toBe(expectedStatus);
}
