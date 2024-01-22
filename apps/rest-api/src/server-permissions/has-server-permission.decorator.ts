import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { ServerPermissions } from './server-permissions.enum';

export const HasServerPermission = (
  permissions: ServerPermissions | 'OWNER',
): CustomDecorator<string> => SetMetadata('server-permission', permissions);
