import { ForbiddenException } from '@nestjs/common';

export class SystemCapacityReachedException extends ForbiddenException {
  constructor() {
    super(SystemCapacityReachedException.name);
  }
}
