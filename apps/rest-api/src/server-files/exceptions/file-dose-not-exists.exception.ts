import { NotFoundException } from '@nestjs/common';

export class FileDoseNotExistsException extends NotFoundException {
  constructor(message: string) {
    super(message, FileDoseNotExistsException.name);
  }
}
