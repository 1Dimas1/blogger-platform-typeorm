/**
 * Type definitions for users testing
 */

import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';

/**
 * Represents a user with login credentials for testing
 */
export interface UserWithCredentials {
  user: UserViewDto;
  login: string;
  password: string;
}

/**
 * Sort field options for users query
 */
export type UserSortField = 'createdAt' | 'login' | 'email';

/**
 * Sort direction options
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Users query filter options
 */
export interface UsersQueryFilter {
  searchLoginTerm?: string | null;
  searchEmailTerm?: string | null;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: UserSortField;
  sortDirection?: SortDirection;
}
