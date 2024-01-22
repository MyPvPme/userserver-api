import { ForbiddenException } from '@nestjs/common';

export class MissingPermissionForExtensionException extends ForbiddenException {
  constructor(message: string) {
    super(MissingPermissionForExtensionException.name, message);
  }
}
