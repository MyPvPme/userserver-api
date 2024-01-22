import { PickType } from '@nestjs/swagger';
import { ServerExtension } from '../server-extension.entity';

export class CreateServerExtensionDto extends PickType(ServerExtension, [
  'type',
  'name',
  'menuItem',
  'permission',
  'deprecatedThruId',
  'isPublic',
]) {
  toServerExtension(): ServerExtension {
    const serverExtension = new ServerExtension();
    serverExtension.type = this.type;
    serverExtension.name = this.name;
    serverExtension.menuItem = this.menuItem;
    serverExtension.permission = this.permission;
    serverExtension.deprecatedThruId = this.deprecatedThruId;
    serverExtension.isPublic = this.isPublic;
    return serverExtension;
  }
}
