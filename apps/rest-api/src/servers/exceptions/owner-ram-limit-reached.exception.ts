import { ForbiddenException } from '@nestjs/common';

export class OwnerRamLimitReachedException extends ForbiddenException {
  constructor() {
    super(OwnerRamLimitReachedException.name);
  }
}
