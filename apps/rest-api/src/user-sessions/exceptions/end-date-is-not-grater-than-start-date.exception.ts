import { BadRequestException } from '@nestjs/common';

export class EndDateIsNotGraterThanStartDateException extends BadRequestException {
  constructor(message: string) {
    super(EndDateIsNotGraterThanStartDateException.name, message);
  }
}
