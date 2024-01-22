import { InternalServerErrorException } from '@nestjs/common';

export class ServerIdCouldNotBeExtractedException extends InternalServerErrorException {
  constructor(message: string) {
    super(message, ServerIdCouldNotBeExtractedException.name);
  }
}
