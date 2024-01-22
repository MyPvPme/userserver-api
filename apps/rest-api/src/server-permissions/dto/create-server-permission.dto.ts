import { PickType } from '@nestjs/swagger';
import { ServerPermission } from '../server-permission.entity';

export class CreateServerPermissionDto extends PickType(ServerPermission, [
  'userUuid',
  'permission',
]) {}
