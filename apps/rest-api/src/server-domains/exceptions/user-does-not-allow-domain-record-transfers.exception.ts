import { ForbiddenException } from '@nestjs/common';

export class UserDoesNotAllowDomainRecordTransfersException extends ForbiddenException {
  constructor(message: string) {
    super(UserDoesNotAllowDomainRecordTransfersException.name, message);
  }
}
