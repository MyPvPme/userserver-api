import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ServerVersionsService } from './server-versions.service';
import {
  AllowedTokens,
  UserserverApiAuthGuard,
  UserserverApiUserToken,
} from '@mypvp/userserver-api-auth';
import { HasPermission } from '../users/has-permission.decorator';
import { ServerVersion } from './server-version.entity';
import { CreateServerVersionDto } from './dto/create-server-version.dto';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';
import { ServerVersionAlreadyExistsException } from './exceptions/server-version-already-exists.exception';
import { EditServerVersionDto } from './dto/edit-server-version.dto';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { HasContext } from '../common/has-context.decorator';
import { OptionalUserContext } from '@mypvp/userserver-api-auth/dist/optional-user-context.decorator';

@Controller('servers/versions')
@ApiCookieAuth()
@ApiBearerAuth()
@ApiTags('server-versions')
@UseGuards(UserserverApiAuthGuard())
export class ServerVersionsController {
  constructor(private readonly serverVersionsService: ServerVersionsService) {}

  @Post()
  @AllowedTokens(UserserverApiUserToken)
  @HasPermission('userserver.admin.version.add')
  @HasContext()
  @ThrowsExceptions(ServerVersionAlreadyExistsException)
  createServerVersion(
    @Body() serverVersionDto: CreateServerVersionDto,
  ): Promise<ServerVersion> {
    return this.serverVersionsService.createServerVersion(serverVersionDto);
  }

  @Patch(':versionName')
  @AllowedTokens(UserserverApiUserToken)
  @HasContext()
  @HasPermission('userserver.admin.version.remove')
  @ThrowsExceptions(ServerVersionAlreadyExistsException)
  editServerVersion(
    @Param('versionName') versionName: string,
    @Body() serverVersionDto: EditServerVersionDto,
  ): Promise<ServerVersion> {
    return this.serverVersionsService.editServerVersion(
      versionName,
      serverVersionDto,
    );
  }

  @Get()
  @HasContext(true)
  @ThrowsExceptions()
  @OptionalUserContext()
  getServerVersions(): Promise<ServerVersion[]> {
    return this.serverVersionsService.getAll();
  }
}
