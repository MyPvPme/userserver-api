import { ForbiddenException } from '@nestjs/common';

export class UserserverDomainRecordLimitReachedException extends ForbiddenException {
  constructor(message: string) {
    super(UserserverDomainRecordLimitReachedException.name, message);
  }
}
