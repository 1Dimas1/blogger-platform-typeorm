import { INestApplication } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { PostsRepository } from '../posts/posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { AuthRepository } from '../auth/auth.repository';
import { commentsFactory } from './comments.factory';
import { postsFactory } from '../posts/posts.factory';
import { blogsFactory } from '../blogs/blogs.factory';
import { usersFactory } from '../users/users.factory';
import {
  expectValidCommentShape,
  expectCommentToMatchInput,
  expectCommentsToMatch,
  expectValidCommentatorInfo,
  expectContentLength,
  expectInitialLikesInfo,
  expectLikesCounts,
  expectMyStatus,
} from './comments.expectations';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import {
  expectValidPaginatedResponse,
  expectSortedBy,
} from '../infrastructure/expect-helpers';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { LikeStatus } from '../../src/modules/blogger-platform/likes/domain/like.entity';
import { delay } from '../utils/delay';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let commentsRepository: CommentsRepository;
  let postsRepository: PostsRepository;
  let blogsRepository: BlogsRepository;
  let authRepository: AuthRepository;
  let httpServer: any;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    httpServer = result.httpServer;
    commentsRepository = result.commentsRepository;
    postsRepository = result.postsRepository;
    blogsRepository = result.blogsRepository;
    authRepository = result.authRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('GET /comments/:id - Get Comment By ID', () => {
    it('should return comment by ID without authentication', async () => {
      // Create blog, post, user, and comment
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        loginResponse.body.accessToken,
      );

      // Get comment without authentication
      const retrievedComment = await commentsRepository.getById(comment.id);

      expectValidCommentShape(retrievedComment);
      expectCommentsToMatch(retrievedComment, comment);
      expectMyStatus(retrievedComment, LikeStatus.None);
    });

    it('should return comment with correct myStatus for authenticated user', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // User likes the comment
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      // Get comment with authentication
      const retrievedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      expectMyStatus(retrievedComment, LikeStatus.Like);
      expectLikesCounts(retrievedComment, 1, 0);
    });

    it('should return comment with correct structure (commentatorInfo, likesInfo)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        loginResponse.body.accessToken,
      );

      const retrievedComment = await commentsRepository.getById(comment.id);

      expectValidCommentShape(retrievedComment);
      expectValidCommentatorInfo(retrievedComment);
      expectContentLength(
        retrievedComment,
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
      );
      expectInitialLikesInfo(retrievedComment);
    });

    it('should return different myStatus for different users', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // User1 creates comment and likes it
      const user1Data = usersFactory.createUserData();
      await authRepository.register(user1Data);
      const user1Login = await authRepository.login(
        user1Data.login,
        user1Data.password,
      );
      const user1Token = user1Login.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        user1Token,
      );

      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token: user1Token } },
      );

      // User2 dislikes the comment
      const user2Data = usersFactory.createUserData();
      await authRepository.register(user2Data);
      const user2Login = await authRepository.login(
        user2Data.login,
        user2Data.password,
      );
      const user2Token = user2Login.body.accessToken;

      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token: user2Token } },
      );

      // Check myStatus for each user
      const asUser1 = await commentsRepository.getById(comment.id, {
        auth: { token: user1Token },
      });
      const asUser2 = await commentsRepository.getById(comment.id, {
        auth: { token: user2Token },
      });
      const unauthenticated = await commentsRepository.getById(comment.id);

      expectMyStatus(asUser1, LikeStatus.Like);
      expectMyStatus(asUser2, LikeStatus.Dislike);
      expectMyStatus(unauthenticated, LikeStatus.None);
      expectLikesCounts(asUser1, 1, 1);
    });

    it('should return 404 for non-existent comment', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      await commentsRepository.getById(nonExistentId, { statusCode: 404 });
    });

    it('should return 404 for deleted comment', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Delete the comment
      await commentsRepository.delete(comment.id, { auth: { token } });

      // Try to get deleted comment
      await commentsRepository.getById(comment.id, { statusCode: 404 });
    });

    it('should show updated likes counts after likes', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Initially no likes
      let retrievedComment = await commentsRepository.getById(comment.id);
      expectLikesCounts(retrievedComment, 0, 0);

      // Add 3 likes from different users
      for (let i = 0; i < 3; i++) {
        const tempUserData = usersFactory.createUserData();
        await authRepository.register(tempUserData);
        const tempLogin = await authRepository.login(
          tempUserData.login,
          tempUserData.password,
        );

        await commentsRepository.updateLikeStatus(
          comment.id,
          { likeStatus: LikeStatus.Like },
          { auth: { token: tempLogin.body.accessToken } },
        );

        if (i < 2) {
          await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
        }
      }

      // Add 2 dislikes from different users
      for (let i = 0; i < 2; i++) {
        const tempUserData = usersFactory.createUserData();
        await authRepository.register(tempUserData);
        const tempLogin = await authRepository.login(
          tempUserData.login,
          tempUserData.password,
        );

        await commentsRepository.updateLikeStatus(
          comment.id,
          { likeStatus: LikeStatus.Dislike },
          { auth: { token: tempLogin.body.accessToken } },
        );

        if (i < 1) {
          await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
        }
      }

      // Check counts are updated
      retrievedComment = await commentsRepository.getById(comment.id);
      expectLikesCounts(retrievedComment, 3, 2);
    });
  });

  describe('PUT /comments/:commentId - Update Comment', () => {
    it('should update comment with valid data when owner', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const updateData = commentsFactory.createUpdateCommentData({
        content: 'Updated content here with sufficient length for validation',
      });

      await commentsRepository.update(comment.id, updateData, {
        auth: { token },
      });

      const updatedComment = await commentsRepository.getById(comment.id);
      expectCommentToMatchInput(updatedComment, updateData);
    });

    it('should update to minimum valid content (20 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const updateData = commentsFactory.createUpdateCommentData({
        content: TEST_HELPERS.createString(
          TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
        ),
      });

      await commentsRepository.update(comment.id, updateData, {
        auth: { token },
      });

      const updatedComment = await commentsRepository.getById(comment.id);
      expect(updatedComment.content.length).toBe(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
      );
    });

    it('should update to maximum valid content (300 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const updateData = commentsFactory.createUpdateCommentData({
        content: TEST_HELPERS.createString(
          TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
        ),
      });

      await commentsRepository.update(comment.id, updateData, {
        auth: { token },
      });

      const updatedComment = await commentsRepository.getById(comment.id);
      expect(updatedComment.content.length).toBe(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
      );
    });

    it('should trim whitespace from updated content', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const validContent = TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
      );
      const updateData = commentsFactory.createUpdateCommentData({
        content: `  ${validContent}  `,
      });

      await commentsRepository.update(comment.id, updateData, {
        auth: { token },
      });

      const updatedComment = await commentsRepository.getById(comment.id);
      expect(updatedComment.content).toBe(validContent);
      expect(updatedComment.content).not.toContain('  ');
    });

    it('should preserve commentatorInfo after update', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const originalCommentatorInfo = comment.commentatorInfo;

      const updateData = commentsFactory.createUpdateCommentData();
      await commentsRepository.update(comment.id, updateData, {
        auth: { token },
      });

      const updatedComment = await commentsRepository.getById(comment.id);
      expect(updatedComment.commentatorInfo).toEqual(originalCommentatorInfo);
    });

    it('should preserve likesInfo after update', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Add a like
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      const commentWithLike = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      const updateData = commentsFactory.createUpdateCommentData();
      await commentsRepository.update(comment.id, updateData, {
        auth: { token },
      });

      const updatedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });
      expectLikesCounts(updatedComment, 1, 0);
      expectMyStatus(updatedComment, LikeStatus.Like);
    });

    it('should return 400 when content is too short (<20 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const updateData = commentsFactory.createCommentDataWithTooShortContent();

      await commentsRepository.update(comment.id, updateData, {
        statusCode: 400,
        auth: { token },
      });
    });

    it('should return 400 when content is too long (>300 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const updateData = commentsFactory.createCommentDataWithTooLongContent();

      await commentsRepository.update(comment.id, updateData, {
        statusCode: 400,
        auth: { token },
      });
    });

    it('should return 400 when content is empty', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const updateData = commentsFactory.createCommentDataWithEmptyContent();

      await commentsRepository.update(comment.id, updateData, {
        statusCode: 400,
        auth: { token },
      });
    });

    it('should return 401 without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const updateData = commentsFactory.createUpdateCommentData();

      await commentsRepository.update(comment.id, updateData, {
        statusCode: 401,
        auth: 'none',
      });
    });

    it('should return 403 when user is not owner', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // User1 creates comment
      const user1Data = usersFactory.createUserData();
      await authRepository.register(user1Data);
      const user1Login = await authRepository.login(
        user1Data.login,
        user1Data.password,
      );
      const user1Token = user1Login.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        user1Token,
      );

      // User2 tries to update
      const user2Data = usersFactory.createUserData();
      await authRepository.register(user2Data);
      const user2Login = await authRepository.login(
        user2Data.login,
        user2Data.password,
      );
      const user2Token = user2Login.body.accessToken;

      const updateData = commentsFactory.createUpdateCommentData();

      await commentsRepository.update(comment.id, updateData, {
        statusCode: 403,
        auth: { token: user2Token },
      });
    });

    it('should return 404 for non-existent comment', async () => {
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const nonExistentId = TEST_HELPERS.createNonExistentId();
      const updateData = commentsFactory.createUpdateCommentData();

      await commentsRepository.update(nonExistentId, updateData, {
        statusCode: 404,
        auth: { token },
      });
    });

    it('should return 404 for deleted comment', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Delete the comment
      await commentsRepository.delete(comment.id, { auth: { token } });

      // Try to update deleted comment
      const updateData = commentsFactory.createUpdateCommentData();
      await commentsRepository.update(comment.id, updateData, {
        statusCode: 404,
        auth: { token },
      });
    });
  });

  describe('DELETE /comments/:commentId - Delete Comment', () => {
    it('should delete comment when owner', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      await commentsRepository.delete(comment.id, { auth: { token } });

      // Verify comment is deleted
      await commentsRepository.getById(comment.id, { statusCode: 404 });
    });

    it('should not return deleted comment in GET /posts/:postId/comments', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      // Create 3 comments
      const comment1 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const comment2 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const comment3 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Delete comment2
      await commentsRepository.delete(comment2.id, { auth: { token } });

      // Get comments for post
      const result = await postsRepository.getComments(post.id);

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.items.find((c) => c.id === comment2.id)).toBeUndefined();
    });

    it('should not return deleted comment in GET /comments/:id (404)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      await commentsRepository.delete(comment.id, { auth: { token } });

      await commentsRepository.getById(comment.id, { statusCode: 404 });
    });

    it('should allow deleting comment with likes', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Add a like
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      // Should allow deletion
      await commentsRepository.delete(comment.id, { auth: { token } });

      await commentsRepository.getById(comment.id, { statusCode: 404 });
    });

    it('should return 401 without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      await commentsRepository.delete(comment.id, {
        statusCode: 401,
        auth: 'none',
      });
    });

    it('should return 403 when user is not owner', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // User1 creates comment
      const user1Data = usersFactory.createUserData();
      await authRepository.register(user1Data);
      const user1Login = await authRepository.login(
        user1Data.login,
        user1Data.password,
      );
      const user1Token = user1Login.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        user1Token,
      );

      // User2 tries to delete
      const user2Data = usersFactory.createUserData();
      await authRepository.register(user2Data);
      const user2Login = await authRepository.login(
        user2Data.login,
        user2Data.password,
      );
      const user2Token = user2Login.body.accessToken;

      await commentsRepository.delete(comment.id, {
        statusCode: 403,
        auth: { token: user2Token },
      });
    });

    it('should return 404 for non-existent comment', async () => {
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const nonExistentId = TEST_HELPERS.createNonExistentId();

      await commentsRepository.delete(nonExistentId, {
        statusCode: 404,
        auth: { token },
      });
    });

    it('should return 404 for already deleted comment', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Delete once
      await commentsRepository.delete(comment.id, { auth: { token } });

      // Try to delete again
      await commentsRepository.delete(comment.id, {
        statusCode: 404,
        auth: { token },
      });
    });
  });

  describe('PUT /comments/:commentId/like-status - Like Operations', () => {
    it('should allow user to like a comment', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      const updatedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      expectLikesCounts(updatedComment, 1, 0);
      expectMyStatus(updatedComment, LikeStatus.Like);
    });

    it('should allow user to dislike a comment', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token } },
      );

      const updatedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      expectLikesCounts(updatedComment, 0, 1);
      expectMyStatus(updatedComment, LikeStatus.Dislike);
    });

    it('should allow user to unlike a comment (set to None)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Like first
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      // Unlike
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.None },
        { auth: { token } },
      );

      const updatedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      expectLikesCounts(updatedComment, 0, 0);
      expectMyStatus(updatedComment, LikeStatus.None);
    });

    it('should allow user to change from like to dislike', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Like first
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      // Change to dislike
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token } },
      );

      const updatedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      expectLikesCounts(updatedComment, 0, 1);
      expectMyStatus(updatedComment, LikeStatus.Dislike);
    });

    it('should allow user to change from dislike to like', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Dislike first
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token } },
      );

      // Change to like
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      const updatedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      expectLikesCounts(updatedComment, 1, 0);
      expectMyStatus(updatedComment, LikeStatus.Like);
    });

    it('should track likes from multiple users independently', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const ownerData = usersFactory.createUserData();
      await authRepository.register(ownerData);
      const ownerLogin = await authRepository.login(
        ownerData.login,
        ownerData.password,
      );
      const ownerToken = ownerLogin.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        ownerToken,
      );

      // Create 3 users who like
      for (let i = 0; i < 3; i++) {
        const userData = usersFactory.createUserData();
        await authRepository.register(userData);
        const loginResponse = await authRepository.login(
          userData.login,
          userData.password,
        );

        await commentsRepository.updateLikeStatus(
          comment.id,
          { likeStatus: LikeStatus.Like },
          { auth: { token: loginResponse.body.accessToken } },
        );

        if (i < 2) {
          await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
        }
      }

      // Create 2 users who dislike
      for (let i = 0; i < 2; i++) {
        const userData = usersFactory.createUserData();
        await authRepository.register(userData);
        const loginResponse = await authRepository.login(
          userData.login,
          userData.password,
        );

        await commentsRepository.updateLikeStatus(
          comment.id,
          { likeStatus: LikeStatus.Dislike },
          { auth: { token: loginResponse.body.accessToken } },
        );

        if (i < 1) {
          await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
        }
      }

      const updatedComment = await commentsRepository.getById(comment.id);
      expectLikesCounts(updatedComment, 3, 2);
    });

    it('should show correct myStatus for different users', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // Create comment owner
      const ownerData = usersFactory.createUserData();
      await authRepository.register(ownerData);
      const ownerLogin = await authRepository.login(
        ownerData.login,
        ownerData.password,
      );
      const ownerToken = ownerLogin.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        ownerToken,
      );

      // User1 likes
      const user1Data = usersFactory.createUserData();
      await authRepository.register(user1Data);
      const user1Login = await authRepository.login(
        user1Data.login,
        user1Data.password,
      );
      const user1Token = user1Login.body.accessToken;

      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token: user1Token } },
      );

      // User2 dislikes
      const user2Data = usersFactory.createUserData();
      await authRepository.register(user2Data);
      const user2Login = await authRepository.login(
        user2Data.login,
        user2Data.password,
      );
      const user2Token = user2Login.body.accessToken;

      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token: user2Token } },
      );

      // Check myStatus for each
      const asUser1 = await commentsRepository.getById(comment.id, {
        auth: { token: user1Token },
      });
      const asUser2 = await commentsRepository.getById(comment.id, {
        auth: { token: user2Token },
      });
      const asOwner = await commentsRepository.getById(comment.id, {
        auth: { token: ownerToken },
      });

      expectMyStatus(asUser1, LikeStatus.Like);
      expectMyStatus(asUser2, LikeStatus.Dislike);
      expectMyStatus(asOwner, LikeStatus.None);
      expectLikesCounts(asUser1, 1, 1);
    });

    it('should allow comment owner to like their own comment', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Owner likes their own comment
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      const updatedComment = await commentsRepository.getById(comment.id, {
        auth: { token },
      });

      expectLikesCounts(updatedComment, 1, 0);
      expectMyStatus(updatedComment, LikeStatus.Like);
    });

    it('should return 401 without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { statusCode: 401, auth: 'none' },
      );
    });

    it('should return 404 for non-existent comment', async () => {
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const nonExistentId = TEST_HELPERS.createNonExistentId();

      await commentsRepository.updateLikeStatus(
        nonExistentId,
        { likeStatus: LikeStatus.Like },
        { statusCode: 404, auth: { token } },
      );
    });

    it('should return 404 for deleted comment', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Delete the comment
      await commentsRepository.delete(comment.id, { auth: { token } });

      // Try to like deleted comment
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { statusCode: 404, auth: { token } },
      );
    });

    it('should return 400 with invalid like status', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Invalid like status
      const invalidStatus = { likeStatus: 'InvalidStatus' as any };

      await commentsRepository.updateLikeStatus(comment.id, invalidStatus, {
        statusCode: 400,
        auth: { token },
      });
    });
  });

  describe('POST /posts/:postId/comments - Create Comment', () => {
    it('should create comment for post with authenticated user', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentData();
      const comment = await postsRepository.createComment(
        post.id,
        commentData,
        {
          auth: { token },
        },
      );

      expectValidCommentShape(comment);
      expectCommentToMatchInput(comment, commentData);
      expect(comment.commentatorInfo.userLogin).toBe(userData.login);
    });

    it('should create comment with minimum valid content (20 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentDataWithMinContent();
      const comment = await postsRepository.createComment(
        post.id,
        commentData,
        {
          auth: { token },
        },
      );

      expect(comment.content.length).toBe(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
      );
      expectValidCommentShape(comment);
    });

    it('should create comment with maximum valid content (300 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentDataWithMaxContent();
      const comment = await postsRepository.createComment(
        post.id,
        commentData,
        {
          auth: { token },
        },
      );

      expect(comment.content.length).toBe(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MAX,
      );
      expectValidCommentShape(comment);
    });

    it('should trim whitespace from content', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const validContent = TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
      );
      const commentData = commentsFactory.createCommentData({
        content: `  ${validContent}  `,
      });

      const comment = await postsRepository.createComment(
        post.id,
        commentData,
        {
          auth: { token },
        },
      );

      expect(comment.content).toBe(validContent);
      expect(comment.content).not.toContain('  ');
    });

    it('should create comment with initial likes info (0/0/None)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentData();
      const comment = await postsRepository.createComment(
        post.id,
        commentData,
        {
          auth: { token },
        },
      );

      expectInitialLikesInfo(comment);
    });

    it('should allow multiple comments from same user on same post', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment1 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const comment2 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const comment3 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      const comments = await postsRepository.getComments(post.id);

      expect(comments.items).toHaveLength(3);
      expect(comments.totalCount).toBe(3);
      expect(
        comments.items.every(
          (c) => c.commentatorInfo.userLogin === userData.login,
        ),
      ).toBe(true);
    });

    it('should allow comments from different users on same post', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // User1
      const user1Data = usersFactory.createUserData();
      await authRepository.register(user1Data);
      const user1Login = await authRepository.login(
        user1Data.login,
        user1Data.password,
      );
      const user1Token = user1Login.body.accessToken;

      const comment1 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        user1Token,
      );

      // User2
      const user2Data = usersFactory.createUserData();
      await authRepository.register(user2Data);
      const user2Login = await authRepository.login(
        user2Data.login,
        user2Data.password,
      );
      const user2Token = user2Login.body.accessToken;

      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const comment2 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        user2Token,
      );

      const comments = await postsRepository.getComments(post.id);

      expect(comments.items).toHaveLength(2);
      expect(comments.totalCount).toBe(2);
      expect(comments.items[0].commentatorInfo.userLogin).not.toBe(
        comments.items[1].commentatorInfo.userLogin,
      );
    });

    it('should cache userLogin in commentatorInfo', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentData();
      const comment = await postsRepository.createComment(
        post.id,
        commentData,
        {
          auth: { token },
        },
      );

      expect(comment.commentatorInfo).toBeDefined();
      expect(comment.commentatorInfo.userId).toBeDefined();
      expect(comment.commentatorInfo.userLogin).toBe(userData.login);
      expectValidCommentatorInfo(comment, undefined, userData.login);
    });

    it('should return 400 when content is too short (<20 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData =
        commentsFactory.createCommentDataWithTooShortContent();

      await postsRepository.createComment(post.id, commentData, {
        statusCode: 400,
        auth: { token },
      });
    });

    it('should return 400 when content is too long (>300 chars)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentDataWithTooLongContent();

      await postsRepository.createComment(post.id, commentData, {
        statusCode: 400,
        auth: { token },
      });
    });

    it('should return 400 when content is empty', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentDataWithEmptyContent();

      await postsRepository.createComment(post.id, commentData, {
        statusCode: 400,
        auth: { token },
      });
    });

    it('should return 401 without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const commentData = commentsFactory.createCommentData();

      await postsRepository.createComment(post.id, commentData, {
        statusCode: 401,
        auth: 'none',
      });
    });

    it('should return 404 when post does not exist', async () => {
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const nonExistentId = TEST_HELPERS.createNonExistentId();
      const commentData = commentsFactory.createCommentData();

      await postsRepository.createComment(nonExistentId, commentData, {
        statusCode: 404,
        auth: { token },
      });
    });

    it('should return 404 when post is deleted', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // Delete the post
      await blogsRepository.deletePost(blog.id, post.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const commentData = commentsFactory.createCommentData();

      await postsRepository.createComment(post.id, commentData, {
        statusCode: 404,
        auth: { token },
      });
    });
  });

  describe('GET /posts/:postId/comments - Get Comments For Post', () => {
    it('should return all comments for post without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createMultipleComments(
        3,
        postsRepository,
        post.id,
        token,
      );

      const result = await postsRepository.getComments(post.id);

      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expectValidPaginatedResponse(result, 1, 10);
      result.items.forEach((comment) => {
        expectValidCommentShape(comment);
        expectMyStatus(comment, LikeStatus.None);
      });
    });

    it('should return empty array when post has no comments', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const result = await postsRepository.getComments(post.id);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expectValidPaginatedResponse(result, 1, 10);
    });

    it('should return comments with correct myStatus for authenticated user', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // User likes the comment
      await commentsRepository.updateLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token } },
      );

      // Get comments with authentication
      const result = await postsRepository.getComments(
        post.id,
        {},
        {
          auth: { token },
        },
      );

      expect(result.items).toHaveLength(1);
      expectMyStatus(result.items[0], LikeStatus.Like);
      expectLikesCounts(result.items[0], 1, 0);
    });

    it('should support pagination with custom page size', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createMultipleComments(
        15,
        postsRepository,
        post.id,
        token,
      );

      const result = await postsRepository.getComments(post.id, {
        pageNumber: 2,
        pageSize: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.totalCount).toBe(15);
      expectValidPaginatedResponse(result, 2, 5);
      expect(result.pagesCount).toBe(3);
    });

    it('should support pagination with default values', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createMultipleComments(
        12,
        postsRepository,
        post.id,
        token,
      );

      const result = await postsRepository.getComments(post.id);

      expect(result.items).toHaveLength(10);
      expect(result.totalCount).toBe(12);
      expectValidPaginatedResponse(result, 1, 10);
      expect(result.pagesCount).toBe(2);
    });

    it('should sort by createdAt descending (default)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createMultipleComments(
        5,
        postsRepository,
        post.id,
        token,
      );

      const result = await postsRepository.getComments(post.id);

      expectSortedBy(result.items, 'desc', (comment) =>
        new Date(comment.createdAt).getTime(),
      );
    });

    it('should sort by createdAt ascending', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createMultipleComments(
        5,
        postsRepository,
        post.id,
        token,
      );

      const result = await postsRepository.getComments(post.id, {
        sortDirection: 'asc',
      });

      expectSortedBy(result.items, 'asc', (comment) =>
        new Date(comment.createdAt).getTime(),
      );
    });

    it('should return correct totalCount and pagesCount', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createMultipleComments(
        23,
        postsRepository,
        post.id,
        token,
      );

      const result = await postsRepository.getComments(post.id, {
        pageSize: 10,
      });

      expect(result.totalCount).toBe(23);
      expect(result.pagesCount).toBe(3);
      expect(result.pageSize).toBe(10);
      expect(result.page).toBe(1);
    }, 10000);

    it('should not return comments from other posts', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post1 = await postsFactory.createPost(blogsRepository, blog.id);
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const post2 = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      // Create comments for post1
      await commentsFactory.createMultipleComments(
        3,
        postsRepository,
        post1.id,
        token,
      );

      // Create comments for post2
      await commentsFactory.createMultipleComments(
        2,
        postsRepository,
        post2.id,
        token,
      );

      // Get comments for post1
      const result1 = await postsRepository.getComments(post1.id);
      expect(result1.items).toHaveLength(3);
      expect(result1.totalCount).toBe(3);

      // Get comments for post2
      const result2 = await postsRepository.getComments(post2.id);
      expect(result2.items).toHaveLength(2);
      expect(result2.totalCount).toBe(2);
    });

    it('should not return deleted comments', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      const comment1 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const comment2 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      const comment3 = await commentsFactory.createComment(
        postsRepository,
        post.id,
        token,
      );

      // Delete comment2
      await commentsRepository.delete(comment2.id, { auth: { token } });

      const result = await postsRepository.getComments(post.id);

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.items.find((c) => c.id === comment2.id)).toBeUndefined();
    });

    it('should return 404 when post does not exist', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      await postsRepository.getComments(nonExistentId, {}, { statusCode: 404 });
    });

    it('should return 404 when post is deleted', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createComment(postsRepository, post.id, token);

      // Delete the post
      await blogsRepository.deletePost(blog.id, post.id);

      // Try to get comments for deleted post
      await postsRepository.getComments(post.id, {}, { statusCode: 404 });
    });

    it('should handle pagination edge cases (last page)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      // Create 11 comments
      await commentsFactory.createMultipleComments(
        11,
        postsRepository,
        post.id,
        token,
      );

      // Get last page (page 2) with pageSize 10
      const result = await postsRepository.getComments(post.id, {
        pageNumber: 2,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(11);
      expect(result.pagesCount).toBe(2);
      expect(result.page).toBe(2);
    });

    it('should return valid paginated structure', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );
      const token = loginResponse.body.accessToken;

      await commentsFactory.createMultipleComments(
        5,
        postsRepository,
        post.id,
        token,
      );

      const result = await postsRepository.getComments(post.id);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('pagesCount');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(Array.isArray(result.items)).toBe(true);
      expectValidPaginatedResponse(result, 1, 10);
    });
  });
});
