import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { CommentViewDto } from '../../src/modules/blogger-platform/comments/api/view-dto/comment.view-dto';
import { UpdateCommentInputDto } from '../../src/modules/blogger-platform/comments/api/input-dto/update-comment.input-dto';
import { LikeInputDto } from '../../src/modules/blogger-platform/likes/api/input-dto/like.input-dto';
import { Constants } from '../../src/core/constants';

interface RequestOptions {
  statusCode?: number;
  auth?: 'none' | { token: string };
}

/**
 * Repository for Comments endpoints.
 * Handles HTTP requests for standalone comment operations (/comments/*).
 * Note: Nested endpoints (POST/GET /posts/:postId/comments) are in PostsRepository.
 */
export class CommentsRepository {
  constructor(private readonly httpServer: any) {}

  /**
   * Get comment by ID
   * GET /comments/:id
   *
   * @param id - Comment ID
   * @param options - Request options (expected status code, auth for like status)
   * @returns Comment view DTO
   *
   * @example
   * const comment = await commentsRepository.getById(commentId);
   *
   * @example
   * // With authentication to see myStatus
   * const comment = await commentsRepository.getById(commentId, {
   *   auth: { token: userAccessToken }
   * });
   */
  async getById(
    id: string,
    options: RequestOptions = {},
  ): Promise<CommentViewDto> {
    const expectedStatus = options.statusCode ?? HttpStatus.OK;
    const auth = options.auth;

    let req = request(this.httpServer).get(
      `/${Constants.GLOBAL_PREFIX}${Constants.PATH.COMMENTS}/${id}`,
    );

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Update comment (owner only)
   * PUT /comments/:commentId
   *
   * @param commentId - Comment ID
   * @param data - Comment update data
   * @param options - Request options (expected status code, auth)
   *
   * @example
   * await commentsRepository.update(commentId, { content: 'Updated content' }, {
   *   auth: { token: ownerToken }
   * });
   */
  async update(
    commentId: string,
    data: UpdateCommentInputDto,
    options: RequestOptions = {},
  ): Promise<void> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth;

    let req = request(this.httpServer)
      .put(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.COMMENTS}/${commentId}`)
      .send(data);

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    } else if (auth === 'none') {
      // No auth
    } else {
      throw new Error('update requires user authentication');
    }

    await req.expect(expectedStatus);
  }

  /**
   * Delete comment (owner only)
   * DELETE /comments/:commentId
   *
   * @param commentId - Comment ID
   * @param options - Request options (expected status code, auth)
   *
   * @example
   * await commentsRepository.delete(commentId, {
   *   auth: { token: ownerToken }
   * });
   */
  async delete(commentId: string, options: RequestOptions = {}): Promise<void> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth;

    let req = request(this.httpServer).delete(
      `/${Constants.GLOBAL_PREFIX}${Constants.PATH.COMMENTS}/${commentId}`,
    );

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    } else if (auth === 'none') {
      // No auth
    } else {
      throw new Error('delete requires user authentication');
    }

    await req.expect(expectedStatus);
  }

  /**
   * Update like status for comment (authenticated user)
   * PUT /comments/:commentId/like-status
   *
   * @param commentId - Comment ID
   * @param likeStatus - Like status (Like, Dislike, None)
   * @param options - Request options (expected status code, auth)
   *
   * @example
   * await commentsRepository.updateLikeStatus(
   *   commentId,
   *   { likeStatus: LikeStatus.Like },
   *   { auth: { token: userToken } }
   * );
   */
  async updateLikeStatus(
    commentId: string,
    likeStatus: LikeInputDto,
    options: RequestOptions = {},
  ): Promise<void> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth;

    let req = request(this.httpServer)
      .put(
        `/${Constants.GLOBAL_PREFIX}${Constants.PATH.COMMENTS}/${commentId}/like-status`,
      )
      .send(likeStatus);

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    } else if (auth === 'none') {
      // No auth
    } else {
      throw new Error('updateLikeStatus requires user authentication');
    }

    await req.expect(expectedStatus);
  }
}
