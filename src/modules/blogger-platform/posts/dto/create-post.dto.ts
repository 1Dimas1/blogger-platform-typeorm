export class CreatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class CreatePostByBlogIdDto {
  title: string;
  shortDescription: string;
  content: string;
}
