import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Server } from './server.entity';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';
import { ServerNotValidException } from './exceptions/server-not-valid.exception';
import { CreateServerDto } from './dto/create-server.dto';
import { ServersService } from './servers.service';
import {
  AllowedTokens,
  NoUserContext,
  UserserverApiAuthGuard,
  UserserverApiSystemToken,
} from '@mypvp/userserver-api-auth';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';
import { HasContext } from '../common/has-context.decorator';
import { LoadServerInterceptor } from './server.interceptor';
import { GetServer } from './get-server.decorator';
import { ServerVersionNotFoundException } from '../server-versions/exceptions/server-version-not-found.exception';
import { HasServerPermission } from '../server-permissions/has-server-permission.decorator';
import { ServerPermissions } from '../server-permissions/server-permissions.enum';
import { ServerIsNotInRightStateException } from './exceptions/server-is-not-in-right-state.exception';
import { EditServerDto } from './dto/edit-server.dto';
import { NoServerPermission } from '../server-permissions/no-server-permission.decorator';
import { OverwriteAllowedServerStatus } from './overwrite-allowed-server-status.decorator';
import { AllServerStatus, ServerStatus } from './server-status.enum';
import { GetServersQueryDto } from './dto/get-servers-query.dto';
import { ServersFilterIsNotAllowedException } from './exceptions/servers-filter-is-not-allowed.exception';
import { ServerInfoDto } from './dto/server-info.dto';
import { ServerIdOrAliasParam } from './server-id-or-alias-param.decorator';
import { RunCommandDto } from './dto/run-command.dto';
import { SetPlayerCountDto } from './dto/set-player-count.dto';
import { OptionalUserContext } from '@mypvp/userserver-api-auth/dist/optional-user-context.decorator';
import { ArchiveServersDto } from './dto/archive-servers.dto';
import { ServerPermissionOverwrite } from '../server-permissions/server-permission-overwrite.decorator';

@ApiTags('servers')
@ApiCookieAuth()
@ApiBearerAuth()
@Controller('servers')
@UseGuards(UserserverApiAuthGuard())
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Get(':serverIdOrAlias')
  @ServerIdOrAliasParam()
  @HasContext()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions(ServerNotValidException)
  @OverwriteAllowedServerStatus(...AllServerStatus)
  async getServerById(@GetServer() server: Server): Promise<Server> {
    return server;
  }

  @Get(':serverIdOrAlias/info')
  @ServerIdOrAliasParam()
  @OptionalUserContext()
  @UseInterceptors(LoadServerInterceptor)
  @NoServerPermission()
  @HasContext(true)
  @OverwriteAllowedServerStatus(...AllServerStatus)
  @ThrowsExceptions()
  async getServerInfo(@GetServer() server: Server): Promise<ServerInfoDto> {
    return ServerInfoDto.fromServer(server);
  }

  @Post(':serverIdOrAlias/start')
  @ServerIdOrAliasParam()
  @ApiQuery({
    name: 'startCommand',
    type: String,
    description:
      'Overwrites the default command required permission: userserver.admin.start_command_overwrite',
    required: false,
  })
  @HasServerPermission(ServerPermissions.START)
  @ServerPermissionOverwrite((server) => !!server.standby)
  @HasContext()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions(ServerIsNotInRightStateException)
  async startServer(
    @GetServer() server: Server,
    @GetUser() user: User,
    @Query('startCommand') startCommand?: string,
  ): Promise<void> {
    if (user.hasPermission('userserver.admin.start_command_overwrite')) {
      await this.serversService.startServer(server, user, startCommand);
    } else {
      await this.serversService.startServer(server, user);
    }
  }

  @Post(':serverIdOrAlias/stop')
  @ServerIdOrAliasParam()
  @ApiQuery({
    name: 'restart',
    type: Boolean,
    required: false,
  })
  @HasServerPermission(ServerPermissions.STOP)
  @HasContext()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions(ServerIsNotInRightStateException)
  async stopServer(
    @GetServer() server: Server,
    @GetUser() user: User,
    @Query('restart') restart?: boolean,
  ): Promise<void> {
    await this.serversService.stopServer(server, user, restart);
  }

  @Post()
  @HasContext()
  @ThrowsExceptions(ServerNotValidException, ServerVersionNotFoundException)
  async createServer(
    @Body() createServerDto: CreateServerDto,
    @GetUser() user: User,
  ): Promise<Server> {
    return this.serversService.createServer(createServerDto, user);
  }

  @Patch(':serverIdOrAlias')
  @HasContext()
  @ServerIdOrAliasParam()
  @ThrowsExceptions(ServerNotValidException, ServerVersionNotFoundException)
  @UseInterceptors(LoadServerInterceptor)
  @HasServerPermission(ServerPermissions.NAME)
  async editServer(
    @GetServer() server: Server,
    @GetUser() user: User,
    @Body() editServerDto: EditServerDto,
  ): Promise<Server> {
    return this.serversService.editServer(editServerDto, server, user);
  }

  /**
   * \n is required to send
   * @param runCommandDto
   * @param server
   */
  @Post(':serverIdOrAlias/command')
  @HasContext()
  @ServerIdOrAliasParam()
  @ThrowsExceptions()
  @UseInterceptors(LoadServerInterceptor)
  @OverwriteAllowedServerStatus(ServerStatus.ONLINE)
  @HasServerPermission(ServerPermissions.TERMINAL)
  runCommand(
    @Body() runCommandDto: RunCommandDto,
    @GetServer() server: Server,
  ): Promise<void> {
    return this.serversService.runCommand(server.id, runCommandDto.command);
  }

  @Post(':serverIdOrAlias/archive')
  @ServerIdOrAliasParam()
  @NoUserContext()
  @AllowedTokens(UserserverApiSystemToken)
  @ThrowsExceptions()
  @UseInterceptors(LoadServerInterceptor)
  @NoServerPermission()
  async archiveServer(@GetServer() server: Server): Promise<void> {
    this.serversService.archiveServer(server.id).catch((e) => console.error(e));
  }

  @Post('archive')
  @NoUserContext()
  @AllowedTokens(UserserverApiSystemToken)
  @ThrowsExceptions()
  @NoServerPermission()
  async archiveServers(
    @Body() archivServers: ArchiveServersDto,
  ): Promise<void> {
    this.serversService
      .archiveOldServers(archivServers.count)
      .catch((e) => console.error(e));
  }

  @Post(':serverIdOrAlias/restore')
  @ServerIdOrAliasParam()
  @HasContext()
  @ServerIdOrAliasParam()
  @OverwriteAllowedServerStatus(ServerStatus.ARCHIVED)
  @ThrowsExceptions()
  @HasServerPermission('OWNER')
  @UseInterceptors(LoadServerInterceptor)
  async restoreServer(@GetServer() server: Server): Promise<void> {
    return this.serversService.restoreServer(server.id);
  }

  @Post(':serverIdOrAlias/reset')
  @HasContext()
  @ServerIdOrAliasParam()
  @ThrowsExceptions()
  @UseInterceptors(LoadServerInterceptor)
  @OverwriteAllowedServerStatus(ServerStatus.OFFLINE)
  @HasServerPermission('OWNER')
  async resetServer(
    @GetServer() server: Server,
    @GetUser() user: User,
  ): Promise<void> {
    await this.serversService.resetServer(server.id, user);
  }

  @Delete(':serverIdOrAlias')
  @HasContext()
  @ServerIdOrAliasParam()
  @ThrowsExceptions()
  @UseInterceptors(LoadServerInterceptor)
  @OverwriteAllowedServerStatus(ServerStatus.OFFLINE)
  @HasServerPermission('OWNER')
  async deleteServer(
    @GetServer() server: Server,
    @GetUser() user: User,
  ): Promise<void> {
    await this.serversService.deleteServer(server.id, user);
  }

  @Post(':serverIdOrAlias/player-count')
  @ServerIdOrAliasParam()
  @NoUserContext()
  @AllowedTokens(UserserverApiSystemToken)
  @ThrowsExceptions()
  @UseInterceptors(LoadServerInterceptor)
  @NoServerPermission()
  async setPlayerCount(
    @GetServer() server: Server,
    @Body() setPlayerCountDto: SetPlayerCountDto,
  ): Promise<void> {
    return this.serversService.setPlayerCount(server.id, setPlayerCountDto);
  }

  @Post(':serverIdOrAlias/join')
  @ServerIdOrAliasParam()
  @HasContext()
  @NoServerPermission()
  @OverwriteAllowedServerStatus(ServerStatus.ONLINE)
  @ThrowsExceptions()
  @UseInterceptors(LoadServerInterceptor)
  async joinServer(
    @GetServer() server: Server,
    @GetUser() user: User,
  ): Promise<void> {
    await this.serversService.joinServer(server.id, user);
  }

  @Get()
  @ThrowsExceptions()
  @HasContext(true)
  @OptionalUserContext()
  @ThrowsExceptions(ServersFilterIsNotAllowedException)
  getServers(
    @GetUser() user: User,
    @Query() filter: GetServersQueryDto,
  ): Promise<ServerInfoDto[]> {
    if (!user) {
      return this.serversService.getServers(filter);
    }

    if (user.hasPermission('userserver.admin.filter')) {
      return this.serversService.getServers(filter);
    }

    if (!filter.status || filter.status.length === 0) {
      throw new ServersFilterIsNotAllowedException(
        'User has no permission to filter without status',
      );
    }

    if (
      filter.status.filter((status) => !['ONLINE', 'STARTING'].includes(status))
        .length != 0
    ) {
      throw new ServersFilterIsNotAllowedException(
        'User is not allowed to use these status',
      );
    }

    return this.serversService.getServers(filter);
  }
}
