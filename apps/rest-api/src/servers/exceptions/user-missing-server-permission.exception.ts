import { ForbiddenException } from '@nestjs/common';

export class UserMissingServerPermissionException extends ForbiddenException {
  constructor(message: string) {
    super(message, UserMissingServerPermissionException.name);
  }
}
