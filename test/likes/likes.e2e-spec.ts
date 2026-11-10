import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import { TEST_CONSTANTS } from '../config/test-constants';
import { delay } from '../utils/delay';
import { LikeStatus } from '../../src/modules/blogger-platform/likes/domain/like.entity';

/**
 * Like/dislike flows for posts and comments (homework 24 scope):
 * counters, per-user myStatus, newestLikes (3 latest "Like", newest first), status changes.
 */
describe('Likes (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  const api = (path: string) => `/api${path}`;

  const createUserAndLogin = async (
    n: number,
  ): Promise<{ id: string; login: string; token: string }> => {
    const login = `liker${n}`;
    const password = 'qwerty1';
    const user = await request(httpServer)
      .post(api('/sa/users'))
      .auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD)
      .send({ login, password, email: `${login}@example.com` })
      .expect(201);
    const res = await request(httpServer)
      .post(api('/auth/login'))
      .set('User-Agent', `agent-${n}`)
      .send({ loginOrEmail: login, password })
      .expect(200);
    return { id: user.body.id, login, token: res.body.accessToken };
  };

  const createBlogWithPosts = async (postsCount: number) => {
    const blog = await request(httpServer)
      .post(api('/sa/blogs'))
      .auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD)
      .send({
        name: 'likes blog',
        description: 'description',
        websiteUrl: 'https://likes.example.com',
      })
      .expect(201);
    const posts: any[] = [];
    for (let i = 0; i < postsCount; i++) {
      const post = await request(httpServer)
        .post(api(`/sa/blogs/${blog.body.id}/posts`))
        .auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD)
        .send({
          title: `post ${i}`,
          shortDescription: 'short',
          content: 'content',
        })
        .expect(201);
      posts.push(post.body);
    }
    return { blog: blog.body, posts };
  };

  const likePost = (postId: string, token: string, likeStatus: LikeStatus) =>
    request(httpServer)
      .put(api(`/posts/${postId}/like-status`))
      .auth(token, { type: 'bearer' })
      .send({ likeStatus })
      .expect(204);

  const likeComment = (
    commentId: string,
    token: string,
    likeStatus: LikeStatus,
  ) =>
    request(httpServer)
      .put(api(`/comments/${commentId}/like-status`))
      .auth(token, { type: 'bearer' })
      .send({ likeStatus })
      .expect(204);

  const getPost = async (postId: string, token?: string) => {
    const req = request(httpServer).get(api(`/posts/${postId}`));
    if (token) req.auth(token, { type: 'bearer' });
    return (await req.expect(200)).body;
  };

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    httpServer = result.httpServer;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('posts', () => {
    it('counts likes/dislikes, returns myStatus per user and the 3 newest likes', async () => {
      const users: { id: string; login: string; token: string }[] = [];
      for (let i = 1; i <= 4; i++) users.push(await createUserAndLogin(i));
      const {
        posts: [post],
      } = await createBlogWithPosts(1);

      // user1..user3 like (in this order), user4 dislikes
      for (const user of users.slice(0, 3)) {
        await likePost(post.id, user.token, LikeStatus.Like);
        await delay(20);
      }
      await likePost(post.id, users[3].token, LikeStatus.Dislike);

      const asUser1 = await getPost(post.id, users[0].token);
      expect(asUser1.extendedLikesInfo).toEqual({
        likesCount: 3,
        dislikesCount: 1,
        myStatus: LikeStatus.Like,
        newestLikes: [users[2], users[1], users[0]].map((u) => ({
          addedAt: expect.any(String),
          userId: u.id,
          login: u.login,
        })),
      });

      expect(
        (await getPost(post.id, users[3].token)).extendedLikesInfo.myStatus,
      ).toBe(LikeStatus.Dislike);
      expect((await getPost(post.id)).extendedLikesInfo.myStatus).toBe(
        LikeStatus.None,
      );

      // user4 switches to Like -> becomes a liker; newest 3 still by like creation time
      await likePost(post.id, users[3].token, LikeStatus.Like);
      const afterSwitch = (await getPost(post.id)).extendedLikesInfo;
      expect(afterSwitch.likesCount).toBe(4);
      expect(afterSwitch.dislikesCount).toBe(0);
      expect(afterSwitch.newestLikes).toHaveLength(3);

      // repeating the same status changes nothing
      await likePost(post.id, users[0].token, LikeStatus.Like);
      expect((await getPost(post.id)).extendedLikesInfo.likesCount).toBe(4);

      // None removes the reaction from counters and newestLikes
      await likePost(post.id, users[2].token, LikeStatus.None);
      const afterNone = (await getPost(post.id, users[2].token))
        .extendedLikesInfo;
      expect(afterNone.likesCount).toBe(3);
      expect(afterNone.myStatus).toBe(LikeStatus.None);
      expect(afterNone.newestLikes.map((l: any) => l.userId)).not.toContain(
        users[2].id,
      );
    });

    it('returns per-post likes info in lists (GET /posts and GET /blogs/:id/posts)', async () => {
      const [user1, user2] = [
        await createUserAndLogin(1),
        await createUserAndLogin(2),
      ];
      const { blog, posts } = await createBlogWithPosts(3);

      await likePost(posts[0].id, user1.token, LikeStatus.Like);
      await likePost(posts[0].id, user2.token, LikeStatus.Like);
      await likePost(posts[1].id, user1.token, LikeStatus.Dislike);

      for (const path of ['/posts', `/blogs/${blog.id}/posts`]) {
        const res = await request(httpServer)
          .get(api(path))
          .auth(user1.token, { type: 'bearer' })
          .expect(200);
        expect(res.body.totalCount).toBe(3);
        const byId = new Map<string, any>(
          res.body.items.map((p: any) => [p.id, p.extendedLikesInfo]),
        );
        expect(byId.get(posts[0].id)).toMatchObject({
          likesCount: 2,
          dislikesCount: 0,
          myStatus: LikeStatus.Like,
        });
        expect(byId.get(posts[0].id).newestLikes).toHaveLength(2);
        expect(byId.get(posts[1].id)).toMatchObject({
          likesCount: 0,
          dislikesCount: 1,
          myStatus: LikeStatus.Dislike,
          newestLikes: [],
        });
        expect(byId.get(posts[2].id)).toMatchObject({
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatus.None,
          newestLikes: [],
        });
      }
    });

    it('validates input and existence', async () => {
      const user = await createUserAndLogin(1);
      const {
        posts: [post],
      } = await createBlogWithPosts(1);

      await request(httpServer)
        .put(api(`/posts/${post.id}/like-status`))
        .auth(user.token, { type: 'bearer' })
        .send({ likeStatus: 'Wrong' })
        .expect(400);
      await request(httpServer)
        .put(api(`/posts/${post.id}/like-status`))
        .send({ likeStatus: LikeStatus.Like })
        .expect(401);
      await request(httpServer)
        .put(api('/posts/6b0b3b9b-8f0e-4c55-9a8e-6f0c7b2a1c11/like-status'))
        .auth(user.token, { type: 'bearer' })
        .send({ likeStatus: LikeStatus.Like })
        .expect(404);
    });
  });

  describe('comments', () => {
    it('counts likes/dislikes and returns myStatus per user, in item and list', async () => {
      const [user1, user2, user3] = [
        await createUserAndLogin(1),
        await createUserAndLogin(2),
        await createUserAndLogin(3),
      ];
      const {
        posts: [post],
      } = await createBlogWithPosts(1);
      const comment = (
        await request(httpServer)
          .post(api(`/posts/${post.id}/comments`))
          .auth(user1.token, { type: 'bearer' })
          .send({ content: 'a comment that is long enough' })
          .expect(201)
      ).body;

      await likeComment(comment.id, user1.token, LikeStatus.Like);
      await likeComment(comment.id, user2.token, LikeStatus.Like);
      await likeComment(comment.id, user3.token, LikeStatus.Dislike);

      const asUser3 = (
        await request(httpServer)
          .get(api(`/comments/${comment.id}`))
          .auth(user3.token, { type: 'bearer' })
          .expect(200)
      ).body;
      expect(asUser3.likesInfo).toEqual({
        likesCount: 2,
        dislikesCount: 1,
        myStatus: LikeStatus.Dislike,
      });
      expect(asUser3.commentatorInfo).toEqual({
        userId: user1.id,
        userLogin: user1.login,
      });

      await likeComment(comment.id, user2.token, LikeStatus.Dislike);
      const list = (
        await request(httpServer)
          .get(api(`/posts/${post.id}/comments`))
          .auth(user2.token, { type: 'bearer' })
          .expect(200)
      ).body;
      expect(list.items[0].likesInfo).toEqual({
        likesCount: 1,
        dislikesCount: 2,
        myStatus: LikeStatus.Dislike,
      });

      // deleting a liked comment removes it together with its likes
      await request(httpServer)
        .delete(api(`/comments/${comment.id}`))
        .auth(user1.token, { type: 'bearer' })
        .expect(204);
      await request(httpServer)
        .get(api(`/comments/${comment.id}`))
        .expect(404);
    });
  });

  describe('blogs and posts relations', () => {
    it('reflects a renamed blog in its posts (blogName comes from the blog)', async () => {
      const { blog, posts } = await createBlogWithPosts(1);
      await request(httpServer)
        .put(api(`/sa/blogs/${blog.id}`))
        .auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD)
        .send({
          name: 'renamed',
          description: 'description',
          websiteUrl: 'https://likes.example.com',
        })
        .expect(204);
      expect((await getPost(posts[0].id)).blogName).toBe('renamed');
    });
  });
});
