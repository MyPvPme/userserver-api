import { User as UserserverUser } from '../users/user.entity';
import { Server } from '../servers/server.entity';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends UserserverUser {}

    interface Request {
      user?: UserserverUser;
      context?: string;
      server?: Server;
    }
  }
}
