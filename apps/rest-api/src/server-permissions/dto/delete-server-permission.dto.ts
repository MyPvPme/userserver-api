import { PickType } from '@nestjs/swagger';
import { ServerPermission } from '../server-permission.entity';
import { ServerPermissions } from '../server-permissions.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class DeleteServerPermissionDto extends PickType(ServerPermission, [
  'userUuid',
]) {
  /**
   * When no permission is specified all permissions are deleted
   */
  @IsEnum(ServerPermissions)
  @IsOptional()
  permission?: ServerPermissions;
}
