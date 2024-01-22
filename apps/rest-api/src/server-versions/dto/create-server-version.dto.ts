import { PickType } from '@nestjs/swagger';
import { ServerVersion } from '../server-version.entity';

export class CreateServerVersionDto extends PickType(ServerVersion, [
  'name',
  'startCommand',
  'image',
]) {
  public toServerVersion(): ServerVersion {
    const serverVersion = new ServerVersion();

    serverVersion.name = this.name;
    serverVersion.startCommand = this.startCommand;
    serverVersion.image = this.image;

    return serverVersion;
  }
}
