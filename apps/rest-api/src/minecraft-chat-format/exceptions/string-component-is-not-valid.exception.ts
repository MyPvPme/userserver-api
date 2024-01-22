import { BadRequestException } from '@nestjs/common';

export class StringComponentIsNotValidException extends BadRequestException {
  constructor() {
    super(StringComponentIsNotValidException.name);
  }
}
