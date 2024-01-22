import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const NoServerPermission = (): CustomDecorator<string> =>
  SetMetadata('no-server-permission', true);
