import { NotAcceptableException } from '@nestjs/common';

export class ServerVersionAlreadyExistsException extends NotAcceptableException {
  constructor(message: string) {
    super(message, ServerVersionAlreadyExistsException.name);
  }
}
