import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { Server } from '../servers/server.entity';
import { User } from '../users/user.entity';

export const ServerPermissionOverwrite = <T>(
  permissionOverwrite: (server: Server, user: User, payload: T) => boolean,
): CustomDecorator<string> =>
  SetMetadata('server-permission-overwrite', permissionOverwrite);
