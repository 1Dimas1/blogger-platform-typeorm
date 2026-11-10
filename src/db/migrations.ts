import { UserAccounts1794309735029 } from './migrations/1794309735029-UserAccounts';
import { BloggerPlatform1794312107155 } from './migrations/1794312107155-BloggerPlatform';
import { QuizGame1794343171650 } from './migrations/1794343171650-QuizGame';

// every migration class, in order; see package.json "migration:*" scripts
export const migrations = [
  UserAccounts1794309735029,
  BloggerPlatform1794312107155,
  QuizGame1794343171650,
];
