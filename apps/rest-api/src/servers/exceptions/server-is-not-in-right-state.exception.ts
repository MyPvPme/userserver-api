import { ConflictException } from '@nestjs/common';

export class ServerIsNotInRightStateException extends ConflictException {
  constructor(message: string) {
    super(ServerIsNotInRightStateException.name, message);
  }
}
