import { ForbiddenException } from '@nestjs/common';

export class FileOperationIsNotAllowedException extends ForbiddenException {
  constructor(message: string) {
    super(message, FileOperationIsNotAllowedException.name);
  }
}
