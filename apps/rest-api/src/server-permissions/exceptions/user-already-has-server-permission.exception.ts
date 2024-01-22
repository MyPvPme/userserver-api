import { ConflictException } from '@nestjs/common';

export class UserAlreadyHasServerPermissionException extends ConflictException {
  constructor(message: string) {
    super(message, UserAlreadyHasServerPermissionException.name);
  }
}
