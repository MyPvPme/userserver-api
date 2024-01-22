import { ForbiddenException } from '@nestjs/common';

export class ServersFilterIsNotAllowedException extends ForbiddenException {
  constructor(message: string) {
    super(ServersFilterIsNotAllowedException.name, message);
  }
}
