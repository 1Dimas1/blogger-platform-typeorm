import { BlogsRepository } from './blogs.repository';
import { blogsFactory } from './blogs.factory';
import { BlogViewDto } from '../../src/modules/blogger-platform/blogs/api/view-dto/blogs.view-dto';
import { PostViewDto } from '../../src/modules/blogger-platform/posts/api/view-dto/post.view-dto';
import { delay } from '../utils/delay';
import { TEST_CONSTANTS } from '../config/test-constants';

/**
 * Creates a blog with a specified number of posts.
 * Useful for testing nested resource operations.
 *
 * @param blogsRepository - Blogs repository instance
 * @param postCount - Number of posts to create for the blog
 * @returns Object containing the blog and its posts
 *
 * @example
 * const { blog, posts } = await createBlogWithPosts(blogsRepository, 5);
 */
export async function createBlogWithPosts(
  blogsRepository: BlogsRepository,
  postCount: number,
): Promise<{ blog: BlogViewDto; posts: PostViewDto[] }> {
  // Create blog
  const blog = await blogsFactory.createBlog(blogsRepository);

  // Create posts for the blog
  const posts: PostViewDto[] = [];
  for (let i = 0; i < postCount; i++) {
    const postData = blogsFactory.createPostData({
      title: `Post ${i + 1} for ${blog.name}`.substring(0, 30),
    });

    const post = await blogsRepository.createPost(blog.id, postData);
    posts.push(post);

    // Add delay to ensure distinct createdAt timestamps
    if (i < postCount - 1) {
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
    }
  }

  return { blog, posts };
}

/**
 * Creates multiple blogs, each with a specified number of posts.
 * Useful for testing pagination and filtering with nested resources.
 *
 * @param blogsRepository - Blogs repository instance
 * @param blogCount - Number of blogs to create
 * @param postsPerBlog - Number of posts to create for each blog
 * @returns Array of objects, each containing a blog and its posts
 *
 * @example
 * const blogsWithPosts = await createMultipleBlogsWithPosts(blogsRepository, 3, 5);
 * // Creates 3 blogs, each with 5 posts
 */
export async function createMultipleBlogsWithPosts(
  blogsRepository: BlogsRepository,
  blogCount: number,
  postsPerBlog: number,
): Promise<Array<{ blog: BlogViewDto; posts: PostViewDto[] }>> {
  const blogsWithPosts: Array<{ blog: BlogViewDto; posts: PostViewDto[] }> = [];

  for (let i = 0; i < blogCount; i++) {
    const { blog, posts } = await createBlogWithPosts(
      blogsRepository,
      postsPerBlog,
    );
    blogsWithPosts.push({ blog, posts });

    // Add delay between blog creations
    if (i < blogCount - 1) {
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
    }
  }

  return blogsWithPosts;
}
