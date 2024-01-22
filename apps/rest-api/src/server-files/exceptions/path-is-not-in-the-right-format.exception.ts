import { BadRequestException } from '@nestjs/common';

export class PathIsNotInTheRightFormatException extends BadRequestException {
  constructor(message: string) {
    super(message, PathIsNotInTheRightFormatException.name);
  }
}
