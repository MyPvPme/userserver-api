import { ConflictException } from '@nestjs/common';

export class AliasAlreadyInUseException extends ConflictException {
  constructor(alias: string) {
    super(
      AliasAlreadyInUseException.name,
      `The alias ${alias} is already in use`,
    );
  }
}
