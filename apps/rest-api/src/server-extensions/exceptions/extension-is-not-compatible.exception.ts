import { NotAcceptableException } from '@nestjs/common';

export class ExtensionIsNotCompatibleException extends NotAcceptableException {
  constructor(message: string) {
    super(ExtensionIsNotCompatibleException.name, message);
  }
}
