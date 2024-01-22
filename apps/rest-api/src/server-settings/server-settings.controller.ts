import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ServerSetting } from './server-setting.entity';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { UserserverApiAuthGuard } from '@mypvp/userserver-api-auth';
import { LoadServerInterceptor } from '../servers/server.interceptor';
import { GetServer } from '../servers/get-server.decorator';
import { Server } from '../servers/server.entity';
import { HasContext } from '../common/has-context.decorator';
import { ServerSettingsService } from './server-settings.service';
import { ServerIdOrAliasParam } from '../servers/server-id-or-alias-param.decorator';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('/servers/:serverIdOrAlias/settings')
@ApiTags('server-settings')
@ApiCookieAuth()
@ApiBearerAuth()
@UseGuards(UserserverApiAuthGuard())
@UseInterceptors(LoadServerInterceptor)
export class ServerSettingsController {
  constructor(private readonly serverSettingsService: ServerSettingsService) {}

  @Get()
  @HasContext()
  @ServerIdOrAliasParam()
  getSettings(@GetServer() server: Server): Promise<ServerSetting> {
    return this.serverSettingsService.getSettings(server.id);
  }

  @Post()
  @HasContext()
  @ServerIdOrAliasParam()
  setSettings(
    @Body() setting: ServerSetting,
    @GetServer() server: Server,
    @GetUser() user: User,
  ): Promise<void> {
    return this.serverSettingsService.saveSettings(server.id, user, setting);
  }
}
