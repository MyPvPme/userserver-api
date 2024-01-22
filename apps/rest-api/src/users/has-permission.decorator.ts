import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const HasPermission = (permission: string): CustomDecorator<string> =>
  SetMetadata('permission', permission);
