import { NotFoundException } from '@nestjs/common';

export class ServerVersionNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message, ServerVersionNotFoundException.name);
  }
}
