import { BadRequestException } from '@nestjs/common';

export class ServerNotValidException extends BadRequestException {
  constructor(message: string) {
    super(message, ServerNotValidException.name);
  }
}
