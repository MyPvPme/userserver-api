import { PickType } from '@nestjs/swagger';
import { Server } from '../server.entity';

export class ServerInfoDto extends PickType(Server, [
  'id',
  'status',
  'ownerUuid',
  'alias',
  'description',
  'name',
  'ram',
  'versionName',
  'slots',
  'playerCount',
  'created',
  'lastStart',
  'iconItem',
  'deletedAt',
  'shortDescription',
  'standby',
  'allowJoinMe',
  'showJoinMe',
]) {
  public static fromServer(server: Server): ServerInfoDto {
    const serverInfo = new ServerInfoDto();

    serverInfo.id = server.id;
    serverInfo.status = server.status;
    serverInfo.ownerUuid = server.ownerUuid;
    serverInfo.alias = server.alias;
    serverInfo.description = server.description;
    serverInfo.name = server.name;
    serverInfo.ram = server.ram;
    serverInfo.versionName = server.versionName;
    serverInfo.slots = server.slots;
    serverInfo.playerCount = server.playerCount;
    serverInfo.created = server.created;
    serverInfo.lastStart = server.lastStart;
    serverInfo.iconItem = server.iconItem;
    serverInfo.deletedAt = server.deletedAt;
    serverInfo.shortDescription = server.shortDescription;
    serverInfo.standby = server.standby;
    serverInfo.allowJoinMe = server.allowJoinMe;
    serverInfo.showJoinMe = server.showJoinMe;

    return serverInfo;
  }
}
