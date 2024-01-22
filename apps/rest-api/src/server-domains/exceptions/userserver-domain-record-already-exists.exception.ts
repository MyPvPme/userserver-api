import { ConflictException } from '@nestjs/common';

export class UserserverDomainRecordAlreadyExistsException extends ConflictException {
  constructor(message: string) {
    super(UserserverDomainRecordAlreadyExistsException.name, message);
  }
}
