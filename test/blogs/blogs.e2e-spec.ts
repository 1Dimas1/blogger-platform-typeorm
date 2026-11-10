import { INestApplication } from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';
import { PostsRepository } from '../posts/posts.repository';
import { blogsFactory } from './blogs.factory';
import { postsFactory } from '../posts/posts.factory';
import {
  expectValidBlogShape,
  expectBlogToMatchInput,
  expectBlogsToMatch,
} from './blogs.expectations';
import { createBlogWithPosts } from './blogs.helpers';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import {
  expectValidPaginatedResponse,
  expectValidationErrors,
  expectErrorResponse,
  expectSortedBy,
  expectAllItemsMatch,
} from '../infrastructure/expect-helpers';
import { TEST_HELPERS } from '../config/test-constants';

describe('Blogs (e2e)', () => {
  let app: INestApplication;
  let blogsRepository: BlogsRepository;
  let postsRepository: PostsRepository;
  let httpServer: any;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    httpServer = result.httpServer;
    blogsRepository = result.blogsRepository;
    postsRepository = result.postsRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('GET /blogs - Get All Blogs', () => {
    it('should return all blogs without authentication', async () => {
      // Create test blogs
      const blog1 = await blogsFactory.createBlog(blogsRepository);
      const blog2 = await blogsFactory.createBlog(blogsRepository);

      // Get all blogs
      const result = await blogsRepository.getAll();

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expectValidPaginatedResponse(result, 1, 10);

      // Verify blog structure
      expectValidBlogShape(result.items[0]);
      expectValidBlogShape(result.items[1]);
    });

    it('should return empty array when no blogs exist', async () => {
      const result = await blogsRepository.getAll();

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expectValidPaginatedResponse(result, 1, 10);
    });

    it('should support pagination with custom page size', async () => {
      // Create 15 blogs
      await blogsFactory.createMultipleBlogs(15, blogsRepository);

      // Get page 2 with page size 5
      const result = await blogsRepository.getAll({
        pageNumber: 2,
        pageSize: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.totalCount).toBe(15);
      expectValidPaginatedResponse(result, 2, 5);
      expect(result.pagesCount).toBe(3);
    });

    it('should respect default pagination (page 1, size 10)', async () => {
      // Create 12 blogs
      await blogsFactory.createMultipleBlogs(12, blogsRepository);

      const result = await blogsRepository.getAll();

      expect(result.items).toHaveLength(10);
      expect(result.totalCount).toBe(12);
      expectValidPaginatedResponse(result, 1, 10);
      expect(result.pagesCount).toBe(2);
    });

    it('should sort by createdAt descending (default)', async () => {
      // Create blogs with delays for distinct timestamps
      const blogs = await blogsFactory.createMultipleBlogs(5, blogsRepository);

      const result = await blogsRepository.getAll();

      // Should be in reverse order (newest first)
      expectSortedBy(result.items, 'desc', (blog) =>
        new Date(blog.createdAt).getTime(),
      );
    });

    it('should sort by createdAt ascending', async () => {
      await blogsFactory.createMultipleBlogs(5, blogsRepository);

      const result = await blogsRepository.getAll({
        sortBy: 'createdAt',
        sortDirection: 'asc',
      });

      expectSortedBy(result.items, 'asc', (blog) =>
        new Date(blog.createdAt).getTime(),
      );
    });

    it('should sort by name descending', async () => {
      await blogsFactory.createBlog(blogsRepository, { name: 'Alpha' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Beta' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Gamma' });

      const result = await blogsRepository.getAll({
        sortBy: 'name',
        sortDirection: 'desc',
      });

      expectSortedBy(result.items, 'desc', (blog) => blog.name);
      expect(result.items[0].name).toBe('Gamma');
      expect(result.items[2].name).toBe('Alpha');
    });

    it('should sort by name ascending', async () => {
      await blogsFactory.createBlog(blogsRepository, { name: 'Gamma' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Alpha' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Beta' });

      const result = await blogsRepository.getAll({
        sortBy: 'name',
        sortDirection: 'asc',
      });

      expectSortedBy(result.items, 'asc', (blog) => blog.name);
      expect(result.items[0].name).toBe('Alpha');
      expect(result.items[2].name).toBe('Gamma');
    });

    it('should filter by searchNameTerm (case-insensitive partial match)', async () => {
      await blogsFactory.createBlog(blogsRepository, { name: 'Tech Blog' });
      await blogsFactory.createBlog(blogsRepository, {
        name: 'Travel Stories',
      });
      await blogsFactory.createBlog(blogsRepository, {
        name: 'TechNews Daily',
      });

      const result = await blogsRepository.getAll({
        searchNameTerm: 'tech',
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expectAllItemsMatch(
        result.items,
        (blog) => blog.name.toLowerCase().includes('tech'),
        'name contains "tech"',
      );
    });

    it('should return empty array when searchNameTerm has no matches', async () => {
      await blogsFactory.createBlog(blogsRepository, { name: 'Tech Blog' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Travel Blog' });

      const result = await blogsRepository.getAll({
        searchNameTerm: 'nonexistent',
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should combine pagination + sorting + filtering', async () => {
      // Create blogs with "Tech" in name
      await blogsFactory.createBlog(blogsRepository, { name: 'Tech Alpha' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Tech Beta' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Tech Gamma' });
      await blogsFactory.createBlog(blogsRepository, { name: 'Tech Delta' });

      // Create blogs without "Tech"
      await blogsFactory.createBlog(blogsRepository, { name: 'Travel Blog' });

      const result = await blogsRepository.getAll({
        searchNameTerm: 'tech',
        sortBy: 'name',
        sortDirection: 'asc',
        pageNumber: 1,
        pageSize: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(4);
      expectValidPaginatedResponse(result, 1, 2);
      expect(result.pagesCount).toBe(2);
      expectSortedBy(result.items, 'asc', (blog) => blog.name);
      expect(result.items[0].name).toBe('Tech Alpha');
    });

    it('should not return soft-deleted blogs', async () => {
      const blog1 = await blogsFactory.createBlog(blogsRepository);
      const blog2 = await blogsFactory.createBlog(blogsRepository);

      // Delete first blog
      await blogsRepository.delete(blog1.id);

      const result = await blogsRepository.getAll();

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.items[0].id).toBe(blog2.id);
    });
  });

  describe('GET /blogs/:id - Get Blog By ID', () => {
    it('should return blog by ID without authentication', async () => {
      const created = await blogsFactory.createBlog(blogsRepository);

      const blog = await blogsRepository.getById(created.id);

      expectValidBlogShape(blog);
      expectBlogsToMatch(blog, created);
    });

    it('should return blog with correct structure', async () => {
      const blogData = blogsFactory.createBlogData({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://testblog.com',
      });

      const created = await blogsRepository.create(blogData);
      const blog = await blogsRepository.getById(created.id);

      expect(blog.id).toBe(created.id);
      expect(blog.name).toBe('Test Blog');
      expect(blog.description).toBe('Test Description');
      expect(blog.websiteUrl).toBe('https://testblog.com');
      expect(blog.isMembership).toBe(false);
      expect(blog.createdAt).toBeDefined();
    });

    it('should return 404 when blog not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      const response = await blogsRepository.getById(nonExistentId, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });

    it('should return 404 when blog is soft-deleted', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);

      // Delete the blog
      await blogsRepository.delete(blog.id);

      // Try to get deleted blog
      const response = await blogsRepository.getById(blog.id, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });
  });

  describe('POST /sa/blogs - Create Blog', () => {
    it('should create blog with admin auth', async () => {
      const blogData = blogsFactory.createBlogData();

      const blog = await blogsRepository.create(blogData);

      expectValidBlogShape(blog);
      expectBlogToMatchInput(blog, blogData);
      expect(blog.isMembership).toBe(false);
    });

    it('should create blog with minimum valid name (1 char)', async () => {
      const blogData = blogsFactory.createBlogDataWithShortName();

      const blog = await blogsRepository.create(blogData);

      expectValidBlogShape(blog);
      expect(blog.name.length).toBe(1);
    });

    it('should create blog with maximum valid name (15 chars)', async () => {
      const blogData = blogsFactory.createBlogDataWithLongName();

      const blog = await blogsRepository.create(blogData);

      expectValidBlogShape(blog);
      expect(blog.name.length).toBe(15);
    });

    it('should create blog with minimum valid description (1 char)', async () => {
      const blogData = blogsFactory.createBlogData({
        description: 'a',
      });

      const blog = await blogsRepository.create(blogData);

      expectValidBlogShape(blog);
      expect(blog.description.length).toBe(1);
    });

    it('should create blog with maximum valid description (500 chars)', async () => {
      const blogData = blogsFactory.createBlogData({
        description: TEST_HELPERS.createString(500),
      });

      const blog = await blogsRepository.create(blogData);

      expectValidBlogShape(blog);
      expect(blog.description.length).toBe(500);
    });

    it('should return 400 when name is empty', async () => {
      const blogData = blogsFactory.createBlogDataWithEmptyName();

      const response = await blogsRepository.create(blogData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['name']);
    });

    it('should return 400 when name is too long (16+ chars)', async () => {
      const blogData = blogsFactory.createBlogDataWithTooLongName();

      const response = await blogsRepository.create(blogData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['name']);
    });

    it('should return 400 when description is empty', async () => {
      const blogData = blogsFactory.createBlogDataWithEmptyDescription();

      const response = await blogsRepository.create(blogData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['description']);
    });

    it('should return 400 when description is too long (501+ chars)', async () => {
      const blogData = blogsFactory.createBlogDataWithTooLongDescription();

      const response = await blogsRepository.create(blogData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['description']);
    });

    it('should return 400 when websiteUrl uses http:// instead of https://', async () => {
      const blogData = blogsFactory.createBlogDataWithHttpUrl();

      const response = await blogsRepository.create(blogData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['websiteUrl']);
    });

    it('should return 400 when websiteUrl is invalid format', async () => {
      const blogData = blogsFactory.createBlogData({
        websiteUrl: 'invalid-url',
      });

      const response = await blogsRepository.create(blogData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['websiteUrl']);
    });

    it('should return 400 when websiteUrl is too long (101+ chars)', async () => {
      const blogData = blogsFactory.createBlogDataWithTooLongUrl();

      const response = await blogsRepository.create(blogData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['websiteUrl']);
    });

    it('should return 401 without admin credentials', async () => {
      const blogData = blogsFactory.createBlogData();

      const response = await blogsRepository.create(blogData, {
        statusCode: 401,
        auth: 'none',
      });

      expectErrorResponse(response, 401);
    });
  });

  describe('PUT /sa/blogs/:id - Update Blog', () => {
    it('should update blog with admin auth', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = blogsFactory.createUpdateBlogData();

      await blogsRepository.update(blog.id, updateData);

      const updated = await blogsRepository.getById(blog.id);
      expectBlogToMatchInput(updated, updateData);
    });

    it('should update all fields', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = blogsFactory.createUpdateBlogData({
        name: 'New Name',
        description: 'New Description',
        websiteUrl: 'https://newurl.com',
      });

      await blogsRepository.update(blog.id, updateData);

      const updated = await blogsRepository.getById(blog.id);
      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('New Description');
      expect(updated.websiteUrl).toBe('https://newurl.com');
    });

    it('should update only name', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = blogsFactory.createUpdateBlogData({
        name: 'Updated Name',
        description: blog.description,
        websiteUrl: blog.websiteUrl,
      });

      await blogsRepository.update(blog.id, updateData);

      const updated = await blogsRepository.getById(blog.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe(blog.description);
      expect(updated.websiteUrl).toBe(blog.websiteUrl);
    });

    it('should return 400 with invalid name', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = blogsFactory.createUpdateBlogData({
        name: TEST_HELPERS.createString(16), // Too long
      });

      const response = await blogsRepository.update(blog.id, updateData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['name']);
    });

    it('should return 400 with invalid description', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = blogsFactory.createUpdateBlogData({
        description: TEST_HELPERS.createString(501), // Too long
      });

      const response = await blogsRepository.update(blog.id, updateData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['description']);
    });

    it('should return 400 with invalid websiteUrl', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = blogsFactory.createUpdateBlogData({
        websiteUrl: 'http://invalid.com', // HTTP instead of HTTPS
      });

      const response = await blogsRepository.update(blog.id, updateData, {
        statusCode: 400,
      });

      expectValidationErrors(response, ['websiteUrl']);
    });

    it('should return 401 without admin credentials', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = blogsFactory.createUpdateBlogData();

      const response = await blogsRepository.update(blog.id, updateData, {
        statusCode: 401,
        auth: 'none',
      });

      expectErrorResponse(response, 401);
    });

    it('should return 404 when blog not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();
      const updateData = blogsFactory.createUpdateBlogData();

      const response = await blogsRepository.update(nonExistentId, updateData, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });

    it('should return 404 when blog is soft-deleted', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      await blogsRepository.delete(blog.id);

      const updateData = blogsFactory.createUpdateBlogData();

      const response = await blogsRepository.update(blog.id, updateData, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });
  });

  describe('DELETE /sa/blogs/:id - Delete Blog', () => {
    it('should soft-delete blog with admin auth', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);

      await blogsRepository.delete(blog.id);

      // Verify blog is not returned
      const response = await blogsRepository.getById(blog.id, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });

    it('should not return deleted blog in getAll', async () => {
      const blog1 = await blogsFactory.createBlog(blogsRepository);
      const blog2 = await blogsFactory.createBlog(blogsRepository);

      await blogsRepository.delete(blog1.id);

      const result = await blogsRepository.getAll();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(blog2.id);
    });

    it('should return 401 without admin credentials', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);

      const response = await blogsRepository.delete(blog.id, {
        statusCode: 401,
        auth: 'none',
      });

      expectErrorResponse(response, 401);
    });

    it('should return 404 when blog not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      const response = await blogsRepository.delete(nonExistentId, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });

    it('should return 404 when blog already deleted', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      await blogsRepository.delete(blog.id);

      // Try to delete again
      const response = await blogsRepository.delete(blog.id, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });
  });

  describe('GET /blogs/:blogId/posts - Get Posts For Blog', () => {
    it('should return posts for specific blog without authentication', async () => {
      const { blog, posts } = await createBlogWithPosts(blogsRepository, 3);

      const result = await blogsRepository.getPosts(blog.id);

      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expectValidPaginatedResponse(result, 1, 10);
    });

    it('should return empty array when blog has no posts', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);

      const result = await blogsRepository.getPosts(blog.id);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expectValidPaginatedResponse(result, 1, 10);
    });

    it('should support pagination for posts', async () => {
      const { blog } = await createBlogWithPosts(blogsRepository, 15);

      const result = await blogsRepository.getPosts(blog.id, {
        pageNumber: 2,
        pageSize: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.totalCount).toBe(15);
      expectValidPaginatedResponse(result, 2, 5);
      expect(result.pagesCount).toBe(3);
    });

    it('should return 404 when blog not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      const response = await blogsRepository.getPosts(
        nonExistentId,
        {},
        {
          statusCode: 404,
        },
      );

      expectErrorResponse(response, 404);
    });
  });

  describe('POST /sa/blogs/:blogId/posts - Create Post For Blog', () => {
    it('should create post for blog with admin auth', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const postData = blogsFactory.createPostData();

      const post = await blogsRepository.createPost(blog.id, postData);

      expect(post).toBeDefined();
      expect(post.title).toBe(postData.title);
      expect(post.shortDescription).toBe(postData.shortDescription);
      expect(post.content).toBe(postData.content);
      expect(post.blogId).toBe(blog.id);
      expect(post.blogName).toBe(blog.name);
    });

    it('should return 401 without admin credentials', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const postData = blogsFactory.createPostData();

      const response = await blogsRepository.createPost(blog.id, postData, {
        statusCode: 401,
        auth: 'none',
      });

      expectErrorResponse(response, 401);
    });

    it('should return 404 when blog not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();
      const postData = blogsFactory.createPostData();

      const response = await blogsRepository.createPost(
        nonExistentId,
        postData,
        {
          statusCode: 404,
        },
      );

      expectErrorResponse(response, 404);
    });

    it('should return 400 with invalid post data', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const invalidPostData = blogsFactory.createPostData({
        title: TEST_HELPERS.createString(31), // Too long
      });

      const response = await blogsRepository.createPost(
        blog.id,
        invalidPostData,
        {
          statusCode: 400,
        },
      );

      expectValidationErrors(response, ['title']);
    });
  });

  describe('PUT /sa/blogs/:blogId/posts/:postId - Update Post For Blog', () => {
    it('should update post with admin auth', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog.id,
        blogsFactory.createPostData(),
      );
      const updateData = postsFactory.createUpdatePostData(blog.id);

      await blogsRepository.updatePost(blog.id, post.id, updateData);

      const updated = await postsRepository.getById(post.id);
      expect(updated.title).toBe(updateData.title);
      expect(updated.shortDescription).toBe(updateData.shortDescription);
      expect(updated.content).toBe(updateData.content);
    });

    it('should return 401 without admin credentials', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog.id,
        blogsFactory.createPostData(),
      );
      const updateData = postsFactory.createUpdatePostData(blog.id);

      const response = await blogsRepository.updatePost(
        blog.id,
        post.id,
        updateData,
        { statusCode: 401, auth: 'none' },
      );

      expectErrorResponse(response, 401);
    });

    it('should return 404 when blog not found', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog.id,
        blogsFactory.createPostData(),
      );
      const updateData = postsFactory.createUpdatePostData(blog.id);
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      const response = await blogsRepository.updatePost(
        nonExistentId,
        post.id,
        updateData,
        { statusCode: 404 },
      );

      expectErrorResponse(response, 404);
    });

    it('should return 404 when post not found', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const updateData = postsFactory.createUpdatePostData(blog.id);
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      const response = await blogsRepository.updatePost(
        blog.id,
        nonExistentId,
        updateData,
        { statusCode: 404 },
      );

      expectErrorResponse(response, 404);
    });

    it('should return 404 when post does not belong to blog', async () => {
      const blog1 = await blogsFactory.createBlog(blogsRepository);
      const blog2 = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog1.id,
        blogsFactory.createPostData(),
      );
      const updateData = postsFactory.createUpdatePostData(blog2.id);

      const response = await blogsRepository.updatePost(
        blog2.id,
        post.id,
        updateData,
        { statusCode: 404 },
      );

      expectErrorResponse(response, 404);
    });
  });

  describe('DELETE /sa/blogs/:blogId/posts/:postId - Delete Post For Blog', () => {
    it('should soft-delete post with admin auth', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog.id,
        blogsFactory.createPostData(),
      );

      await blogsRepository.deletePost(blog.id, post.id);

      const result = await postsRepository.getById(post.id, {
        statusCode: 404,
      });
      expectErrorResponse(result, 404);
    });

    it('should return 401 without admin credentials', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog.id,
        blogsFactory.createPostData(),
      );

      const response = await blogsRepository.deletePost(blog.id, post.id, {
        statusCode: 401,
        auth: 'none',
      });

      expectErrorResponse(response, 401);
    });

    it('should return 404 when blog not found', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog.id,
        blogsFactory.createPostData(),
      );
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      const response = await blogsRepository.deletePost(
        nonExistentId,
        post.id,
        { statusCode: 404 },
      );

      expectErrorResponse(response, 404);
    });

    it('should return 404 when post not found', async () => {
      const blog = await blogsFactory.createBlog(blogsRepository);
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      const response = await blogsRepository.deletePost(
        blog.id,
        nonExistentId,
        { statusCode: 404 },
      );

      expectErrorResponse(response, 404);
    });

    it('should return 404 when post does not belong to blog', async () => {
      const blog1 = await blogsFactory.createBlog(blogsRepository);
      const blog2 = await blogsFactory.createBlog(blogsRepository);
      const post = await blogsRepository.createPost(
        blog1.id,
        blogsFactory.createPostData(),
      );

      const response = await blogsRepository.deletePost(blog2.id, post.id, {
        statusCode: 404,
      });

      expectErrorResponse(response, 404);
    });
  });
});
