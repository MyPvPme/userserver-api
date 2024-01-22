import { ForbiddenException } from '@nestjs/common';

export class ServerIsFullException extends ForbiddenException {
  constructor(message: string) {
    super(ServerIsFullException.name, message);
  }
}
