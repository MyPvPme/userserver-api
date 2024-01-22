import { InternalServerErrorException } from '@nestjs/common';

export class NoConnectionFoundException extends InternalServerErrorException {
  constructor(message: string) {
    super(message, NoConnectionFoundException.name);
  }
}
