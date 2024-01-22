import {
  Body,
  Controller,
  Delete,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { UserserverApiAuthGuard } from '@mypvp/userserver-api-auth';
import { HasContext } from '../common/has-context.decorator';
import { LoadServerInterceptor } from '../servers/server.interceptor';
import { ServerPermissions } from './server-permissions.enum';
import { GetServer } from '../servers/get-server.decorator';
import { Server } from '../servers/server.entity';
import { ServerPermissionsService } from './server-permissions.service';
import { CreateServerPermissionDto } from './dto/create-server-permission.dto';
import { ServerPermission } from './server-permission.entity';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';
import { UserCouldNotReceivePermissionException } from './exceptions/user-could-not-receive-permission.exception';
import { UserDoNotHaveTheServerPermissionException } from './exceptions/user-do-not-have-the-server-permission.exception';
import { DeleteServerPermissionDto } from './dto/delete-server-permission.dto';
import { HasServerPermission } from './has-server-permission.decorator';
import { ServerIdOrAliasParam } from '../servers/server-id-or-alias-param.decorator';
import { ServerPermissionOverwrite } from './server-permission-overwrite.decorator';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('server-permissions')
@ApiCookieAuth()
@ApiBearerAuth()
@Controller('/servers/:serverIdOrAlias/permissions')
@UseGuards(UserserverApiAuthGuard())
export class ServerPermissionsController {
  constructor(
    private readonly serverPermissionsService: ServerPermissionsService,
  ) {}

  /**
   * Creates a new permission binding
   * @param server
   * @param user
   * @param createServerPermissionDto
   */
  @Post()
  @HasContext()
  @ServerIdOrAliasParam()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions(UserCouldNotReceivePermissionException)
  @HasServerPermission(ServerPermissions.PERMISSIONS)
  createServerPermission(
    @GetServer() server: Server,
    @GetUser() user: User,
    @Body() createServerPermissionDto: CreateServerPermissionDto,
  ): Promise<ServerPermission> {
    return this.serverPermissionsService.createServerPermission(
      user,
      createServerPermissionDto,
      server,
    );
  }

  /**
   * Deletes a permission binding
   * @param server
   * @param user
   * @param deleteServerPermissionDto
   */
  @Delete()
  @HasContext()
  @ServerIdOrAliasParam()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions(UserDoNotHaveTheServerPermissionException)
  @HasServerPermission(ServerPermissions.PERMISSIONS)
  @ServerPermissionOverwrite<DeleteServerPermissionDto>(
    (server, user, payload) => user.uuid === payload.userUuid,
  )
  deleteServerPermission(
    @GetServer() server: Server,
    @GetUser() user: User,
    @Body() deleteServerPermissionDto: DeleteServerPermissionDto,
  ): Promise<void> {
    return this.serverPermissionsService.deleteServerPermission(
      user,
      deleteServerPermissionDto,
      server.id,
    );
  }
}
