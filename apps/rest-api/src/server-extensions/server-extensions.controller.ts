import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  NoUserContext,
  UserserverApiAuthGuard,
} from '@mypvp/userserver-api-auth';
import { ServerExtensionsService } from './server-extensions.service';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';
import { ServerExtension } from './server-extension.entity';
import { GetServerExtensionVersionsQueryDto } from './dto/get-server-extension-versions-query.dto';
import { ServerExtensionFile } from './server-extension-file.entity';
import { ServerExtensionVersion } from './server-extension-version.entity';
import { LoadServerInterceptor } from '../servers/server.interceptor';
import { HasPermission } from '../users/has-permission.decorator';
import { ServerPermissions } from '../server-permissions/server-permissions.enum';
import { HasContext } from '../common/has-context.decorator';
import { ApiImplicitQuery } from '@nestjs/swagger/dist/decorators/api-implicit-query.decorator';
import { GetServer } from '../servers/get-server.decorator';
import { Server } from '../servers/server.entity';
import { SpigotPlugin } from './dto/plugin/spigot-plugin.dto';
import { ServerIdOrAliasParam } from '../servers/server-id-or-alias-param.decorator';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';
import { GetLatestServerExtensionVersionsQueryDto } from './dto/get-latest-server-extension-versions-query.dto';
import { CreateServerExtensionDto } from './dto/create-server-extension.dto';
import { HasServerPermission } from '../server-permissions/has-server-permission.decorator';
import { CreateServerExtensionVersionDto } from './dto/create-server-extension-version.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateServerExtensionFileDto } from './dto/create-server-extension-file.dto';

@Controller('servers')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiTags('server-extensions')
@UseGuards(UserserverApiAuthGuard())
export class ServerExtensionsController {
  constructor(
    private readonly serverExtensionsService: ServerExtensionsService,
  ) {}

  @Get('extensions')
  @NoUserContext()
  @ThrowsExceptions()
  getAllExtensions(): Promise<ServerExtension[]> {
    return this.serverExtensionsService.getAllExtensionsOrCached();
  }

  @Get('extensions/versions')
  @NoUserContext()
  @ThrowsExceptions()
  getAllVersions(
    @Query() getVersionsQuery: GetServerExtensionVersionsQueryDto,
  ): Promise<ServerExtensionVersion[]> {
    return this.serverExtensionsService.getAllVersions(
      getVersionsQuery.versions,
      getVersionsQuery.withExtensions ? ['serverExtension'] : [],
    );
  }

  @Get('extensions/versions/latest')
  @NoUserContext()
  @ThrowsExceptions()
  getLatestServerVersions(
    @Query() getLatestVersionsQuery: GetLatestServerExtensionVersionsQueryDto,
  ): Promise<ServerExtensionVersion[]> {
    return this.serverExtensionsService.getLatestVersions(
      getLatestVersionsQuery.version,
      getLatestVersionsQuery.withExtensions ? ['serverExtension'] : [],
    );
  }

  @Get('extensions/files')
  @NoUserContext()
  @ThrowsExceptions()
  getAllFiles(): Promise<ServerExtensionFile[]> {
    return this.serverExtensionsService.getAllFiles();
  }

  @Get(':serverIdOrAlias/extensions/plugins')
  @UseInterceptors(LoadServerInterceptor)
  @HasServerPermission(ServerPermissions.PLUGINS)
  @ServerIdOrAliasParam()
  @HasContext()
  @ApiImplicitQuery({
    name: 'withPluginYml',
    required: false,
    type: Boolean,
  })
  getServerSpigotPlugins(
    @GetServer() server: Server,
    @Query('withPluginYml', ParseBoolPipe) withPluginYml: boolean,
  ): Promise<SpigotPlugin[]> {
    return this.serverExtensionsService.getSpigotPluginsFromServer(
      server,
      withPluginYml,
    );
  }

  @Post(':serverIdOrAlias/extensions/:extensionVersionId')
  @UseInterceptors(LoadServerInterceptor)
  @HasServerPermission(ServerPermissions.PLUGINS)
  @ServerIdOrAliasParam()
  @ApiParam({ name: 'extensionVersionId', type: 'integer' })
  @ApiQuery({ name: 'force', type: 'boolean' })
  @HasContext()
  installExtension(
    @GetServer() server: Server,
    @GetUser() user: User,
    @Param('extensionVersionId', ParseIntPipe) extensionId: number,
    @Query('force', ParseBoolPipe) force: boolean,
  ): Promise<void> {
    return this.serverExtensionsService.installExtensionToServer(
      server,
      {
        id: extensionId,
      },
      user,
      force,
    );
  }

  @Delete(':serverIdOrAlias/extensions/:extensionVersionId')
  @UseInterceptors(LoadServerInterceptor)
  @HasServerPermission(ServerPermissions.PLUGINS)
  @ServerIdOrAliasParam()
  @ApiParam({ name: 'extensionVersionId', type: 'integer' })
  @HasContext()
  deleteExtension(
    @GetServer() server: Server,
    @GetUser() user: User,
    @Param('extensionVersionId', ParseIntPipe) extensionId: number,
  ): Promise<void> {
    return this.serverExtensionsService.deleteExtensionFromServer(
      server,
      {
        id: extensionId,
      },
      user,
    );
  }

  @Post('extensions')
  @HasContext()
  @HasPermission('userserver.admin.extensions.create')
  createServerExtension(
    @Body() createServerExtensionDto: CreateServerExtensionDto,
  ): Promise<ServerExtension> {
    return this.serverExtensionsService.createExtension(
      createServerExtensionDto,
    );
  }

  @Post('extensions/:extensionId/versions')
  @HasContext()
  @ApiParam({ name: 'extensionId', type: 'integer' })
  @HasPermission('userserver.admin.extensions.version.create')
  createServerExtensionVersion(
    @Body() createServerExtensionVersionDto: CreateServerExtensionVersionDto,
    @Param('extensionId', ParseIntPipe) extensionId: number,
  ): Promise<ServerExtensionVersion> {
    return this.serverExtensionsService.createExtensionVersion(
      createServerExtensionVersionDto,
      extensionId,
    );
  }

  @Post('extensions/:extensionId/versions/:versionId/files')
  @HasContext()
  @HasPermission('userserver.admin.extensions.version.file.create')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        path: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
      },
    },
  })
  @ApiParam({ name: 'extensionId', type: 'integer' })
  @ApiParam({ name: 'versionId', type: 'integer' })
  @UseInterceptors(FilesInterceptor('file', 1))
  createServerExtensionFile(
    @UploadedFiles() file: Express.Multer.File[],
    @Body() createServeExtensionFile: CreateServerExtensionFileDto,
    @GetUser() user: User,
    @Param('versionId', ParseIntPipe) versionId: number,
  ): Promise<ServerExtensionFile> {
    return this.serverExtensionsService.createExtensionFile(
      versionId,
      createServeExtensionFile,
      file[0],
    );
  }
}
