import { PickType } from '@nestjs/swagger';
import { Server } from '../server.entity';

export class CreateServerDto extends PickType(Server, [
  'name',
  'alias',
  'ram',
  'slots',
  'description',
  'iconItem',
  'versionName',
  'publicStatusAnnounce',
  'standby',
  'allowJoinMe',
  'showJoinMe',
  'shortDescription',
]) {
  public toServer(): Server {
    const server = new Server();

    server.name = this.name;
    server.alias = this.alias;
    server.ram = this.ram;
    server.slots = this.slots;
    server.description = this.description;
    server.iconItem = this.iconItem;
    server.versionName = this.versionName;
    server.standby = this.standby;
    server.publicStatusAnnounce = this.publicStatusAnnounce;
    server.showJoinMe = this.showJoinMe;
    server.allowJoinMe = this.allowJoinMe;
    server.shortDescription = this.shortDescription;

    return server;
  }
}
