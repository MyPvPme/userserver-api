import { NotFoundException } from '@nestjs/common';

export class UserserverDomainNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(UserserverDomainNotFoundException.name, message);
  }
}
