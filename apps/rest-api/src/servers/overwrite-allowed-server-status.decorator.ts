import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { ServerStatus } from './server-status.enum';

export const OverwriteAllowedServerStatus = (
  ...status: ServerStatus[]
): CustomDecorator<string> => SetMetadata('allowed-server-status', status);
