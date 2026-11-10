import { User } from '../modules/user-accounts/domain/user.entity';
import { SecurityDevice } from '../modules/user-accounts/domain/security-device.entity';

// every TypeORM entity of the app; used by the app DataSource and the migrations CLI
export const entities = [User, SecurityDevice];
