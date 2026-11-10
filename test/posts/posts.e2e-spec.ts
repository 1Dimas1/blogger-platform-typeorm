import { INestApplication } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { AuthRepository } from '../auth/auth.repository';
import { postsFactory } from './posts.factory';
import { blogsFactory } from '../blogs/blogs.factory';
import {
  expectValidPostShape,
  expectPostToMatchInput,
  expectPostsToMatch,
  expectInitialLikesInfo,
  expectLikesCounts,
  expectMyStatus,
  expectNewestLikesCount,
} from './posts.expectations';
import { createPostWithComments } from './posts.helpers';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import {
  expectValidPaginatedResponse,
  expectValidationErrors,
  expectSortedBy,
} from '../infrastructure/expect-helpers';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { LikeStatus } from '../../src/modules/blogger-platform/likes/domain/like.entity';
import { usersFactory } from '../users/users.factory';
import { delay } from '../utils/delay';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let postsRepository: PostsRepository;
  let blogsRepository: BlogsRepository;
  let authRepository: AuthRepository;
  let httpServer: any;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    httpServer = result.httpServer;
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

  describe('GET /posts - Get All Posts', () => {
    it('should return all posts without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post1 = await postsFactory.createPost(blogsRepository, blog.id);
      const post2 = await postsFactory.createPost(blogsRepository, blog.id);

      const result = await postsRepository.getAll();

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expectValidPaginatedResponse(result, 1, 10);

      expectValidPostShape(result.items[0]);
      expectValidPostShape(result.items[1]);
      expectInitialLikesInfo(result.items[0]);
      expectInitialLikesInfo(result.items[1]);
    });

    it('should return empty array when no posts exist', async () => {
      const result = await postsRepository.getAll();

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expectValidPaginatedResponse(result, 1, 10);
    });

    it('should support pagination with custom page size', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      await postsFactory.createMultiplePosts(15, blogsRepository, blog.id);

      const result = await postsRepository.getAll({
        pageNumber: 2,
        pageSize: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.totalCount).toBe(15);
      expectValidPaginatedResponse(result, 2, 5);
      expect(result.pagesCount).toBe(3);
    });

    it('should sort by createdAt descending (default)', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      await postsFactory.createMultiplePosts(5, blogsRepository, blog.id);

      const result = await postsRepository.getAll();

      expectSortedBy(result.items, 'desc', (post) =>
        new Date(post.createdAt).getTime(),
      );
    });

    it('should include correct blogName in posts', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository, {
        name: 'Test Blog',
      });
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const result = await postsRepository.getAll();

      expect(result.items[0].blogName).toBe('Test Blog');
      expect(result.items[0].blogId).toBe(blog.id);
    });

    it('should show correct myStatus when user is authenticated', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // Create user and login
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      // Like the post
      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token: loginResponse.body.accessToken } },
      );

      // Get posts with authentication
      const result = await postsRepository.getAll(
        {},
        {
          auth: { token: loginResponse.body.accessToken },
        },
      );

      expectMyStatus(result.items[0], LikeStatus.Like);
    });

    it('should not return soft-deleted posts', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post1 = await postsFactory.createPost(blogsRepository, blog.id);
      const post2 = await postsFactory.createPost(blogsRepository, blog.id);

      await blogsRepository.deletePost(blog.id, post1.id);

      const result = await postsRepository.getAll();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(post2.id);
    });
  });

  describe('GET /posts/:id - Get Post By ID', () => {
    it('should return post by ID without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const created = await postsFactory.createPost(blogsRepository, blog.id);

      const post = await postsRepository.getById(created.id);

      expectValidPostShape(post);
      expectPostsToMatch(post, created);
      expectInitialLikesInfo(post);
    });

    it('should return post with correct structure', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const postData = postsFactory.createPostData(blog.id, {
        title: 'Test Post',
        shortDescription: 'Test Description',
        content: 'Test Content',
      });

      const created = await blogsRepository.createPost(blog.id, postData);
      const post = await postsRepository.getById(created.id);

      expect(post.title).toBe('Test Post');
      expect(post.shortDescription).toBe('Test Description');
      expect(post.content).toBe('Test Content');
      expect(post.blogId).toBe(blog.id);
      expect(post.blogName).toBe(blog.name);
    });

    it('should show correct myStatus for authenticated user', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // Create user and login
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      // Dislike the post
      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token: loginResponse.body.accessToken } },
      );

      // Get post with authentication
      const result = await postsRepository.getById(post.id, {
        auth: { token: loginResponse.body.accessToken },
      });

      expectMyStatus(result, LikeStatus.Dislike);
    });
  });

  describe('PUT /posts/:postId/like-status - Like Operations', () => {
    it('should allow user to like a post', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // Create user and login
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      // Like the post
      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token: loginResponse.body.accessToken } },
      );

      // Verify like was recorded
      const updated = await postsRepository.getById(post.id, {
        auth: { token: loginResponse.body.accessToken },
      });

      expectLikesCounts(updated, 1, 0);
      expectMyStatus(updated, LikeStatus.Like);
      expectNewestLikesCount(updated, 1);
      expect(updated.extendedLikesInfo.newestLikes[0].userId).toBeDefined();
      expect(updated.extendedLikesInfo.newestLikes[0].login).toBe(
        userData.login,
      );
    });

    it('should allow user to dislike a post', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token: loginResponse.body.accessToken } },
      );

      const updated = await postsRepository.getById(post.id, {
        auth: { token: loginResponse.body.accessToken },
      });

      expectLikesCounts(updated, 0, 1);
      expectMyStatus(updated, LikeStatus.Dislike);
      expectNewestLikesCount(updated, 0); // Dislikes don't appear in newestLikes
    });

    it('should allow user to unlike a post', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      // Like
      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token: loginResponse.body.accessToken } },
      );

      // Unlike
      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.None },
        { auth: { token: loginResponse.body.accessToken } },
      );

      const updated = await postsRepository.getById(post.id, {
        auth: { token: loginResponse.body.accessToken },
      });

      expectLikesCounts(updated, 0, 0);
      expectMyStatus(updated, LikeStatus.None);
      expectNewestLikesCount(updated, 0);
    });

    it('should maintain newestLikes list with max 3 likes', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      // Create 5 users and have them like the post
      for (let i = 0; i < 5; i++) {
        const userData = usersFactory.createUserData();
        await authRepository.register(userData);
        const loginResponse = await authRepository.login(
          userData.login,
          userData.password,
        );

        await postsRepository.updateLikeStatus(
          post.id,
          { likeStatus: LikeStatus.Like },
          { auth: { token: loginResponse.body.accessToken } },
        );

        // Small delay to ensure distinct timestamps
        if (i < 4) {
          await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
        }
      }

      const updated = await postsRepository.getById(post.id);

      expectLikesCounts(updated, 5, 0);
      expectNewestLikesCount(updated, 3); // Should only keep 3 newest
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

      // Like
      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        { auth: { token: loginResponse.body.accessToken } },
      );

      // Change to dislike
      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Dislike },
        { auth: { token: loginResponse.body.accessToken } },
      );

      const updated = await postsRepository.getById(post.id, {
        auth: { token: loginResponse.body.accessToken },
      });

      expectLikesCounts(updated, 0, 1);
      expectMyStatus(updated, LikeStatus.Dislike);
    });

    it('should return 401 without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      await postsRepository.updateLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        { statusCode: 401, auth: 'none' },
      );
    });
  });

  describe('GET /posts/:postId/comments - Get Comments For Post', () => {
    it('should return comments for specific post without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);

      // Create user for comments
      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      const { post } = await createPostWithComments(
        blogsRepository,
        postsRepository,
        blog.id,
        3,
        loginResponse.body.accessToken,
      );

      const result = await postsRepository.getComments(post.id);

      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expectValidPaginatedResponse(result, 1, 10);
    });

    it('should return empty array when post has no comments', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const result = await postsRepository.getComments(post.id);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should support pagination for comments', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      const { post } = await createPostWithComments(
        blogsRepository,
        postsRepository,
        blog.id,
        15,
        loginResponse.body.accessToken,
      );

      const result = await postsRepository.getComments(post.id, {
        pageNumber: 2,
        pageSize: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.totalCount).toBe(15);
      expectValidPaginatedResponse(result, 2, 5);
    });
  });

  describe('POST /posts/:postId/comments - Create Comment For Post', () => {
    it('should create comment for post with authenticated user', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      const commentData = {
        content: TEST_HELPERS.createString(
          TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
        ),
      };

      const comment = await postsRepository.createComment(
        post.id,
        commentData,
        { auth: { token: loginResponse.body.accessToken } },
      );

      expect(comment).toBeDefined();
      expect(comment.content).toBe(commentData.content);
      expect(comment.commentatorInfo.userId).toBeDefined();
      expect(comment.commentatorInfo.userLogin).toBe(userData.login);
    });

    it('should return 401 without authentication', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const commentData = {
        content: TEST_HELPERS.createString(
          TEST_CONSTANTS.VALIDATION.COMMENT.CONTENT_MIN,
        ),
      };

      await postsRepository.createComment(post.id, commentData, {
        statusCode: 401,
        auth: 'none',
      });
    });

    it('should return 400 with invalid comment data', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await postsFactory.createPost(blogsRepository, blog.id);

      const userData = usersFactory.createUserData();
      await authRepository.register(userData);
      const loginResponse = await authRepository.login(
        userData.login,
        userData.password,
      );

      const invalidCommentData = {
        content: 'Short', // Too short (min 20 chars)
      };

      const response = await postsRepository.createComment(
        post.id,
        invalidCommentData,
        {
          statusCode: 400,
          auth: { token: loginResponse.body.accessToken },
        },
      );

      expectValidationErrors(response, ['content']);
    });
  });
});
