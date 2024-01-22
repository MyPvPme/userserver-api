import { ForbiddenException } from '@nestjs/common';

export class UserDoesNotHaveThePermissionException extends ForbiddenException {
  constructor(message: string) {
    super(UserDoesNotHaveThePermissionException.name, message);
  }
}
