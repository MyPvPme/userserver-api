import { BadRequestException } from '@nestjs/common';

export class TokenNotFoundException extends BadRequestException {
  constructor(message: string) {
    super(TokenNotFoundException.name, message);
  }
}
