import { PickType } from '@nestjs/swagger';
import { ServerExtensionFile } from '../server-extension-file.entity';

export class CreateServerExtensionFileDto extends PickType(
  ServerExtensionFile,
  ['path', 'name'],
) {}
