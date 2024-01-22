import { BadRequestException } from '@nestjs/common';

export class UserDoNotHaveTheServerPermissionException extends BadRequestException {
  constructor(message: string) {
    super(message, UserDoNotHaveTheServerPermissionException.name);
  }
}
