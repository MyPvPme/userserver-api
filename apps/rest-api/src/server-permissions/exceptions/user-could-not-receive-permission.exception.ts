import { BadRequestException } from '@nestjs/common';

export class UserCouldNotReceivePermissionException extends BadRequestException {
  constructor(message: string) {
    super(message, UserCouldNotReceivePermissionException.name);
  }
}
