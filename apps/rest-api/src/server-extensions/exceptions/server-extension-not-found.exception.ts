import { NotFoundException } from '@nestjs/common';

export class ServerExtensionNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(ServerExtensionNotFoundException.name, message);
  }
}
