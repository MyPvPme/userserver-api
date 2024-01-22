import { PickType } from '@nestjs/swagger';
import { ServerVersion } from '../server-version.entity';

export class EditServerVersionDto extends PickType(ServerVersion, [
  'image',
  'startCommand',
]) {}
