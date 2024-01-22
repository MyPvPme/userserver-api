import { ConflictException } from '@nestjs/common';

export class FileAlreadyExistsException extends ConflictException {
  constructor(message: string) {
    super(message, FileAlreadyExistsException.name);
  }
}
