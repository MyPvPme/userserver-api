import { NotFoundException } from '@nestjs/common';

export class ServerNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message, ServerNotFoundException.name);
  }
}
