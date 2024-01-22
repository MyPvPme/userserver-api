import { NotFoundException } from '@nestjs/common';

export class UserserverDomainRecordNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(UserserverDomainRecordNotFoundException.name, message);
  }
}
