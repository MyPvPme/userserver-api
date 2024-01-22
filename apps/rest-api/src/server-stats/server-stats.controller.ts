import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { PlayerPlayTimeDto } from './dto/player-play-time.dto';
import { ServerStatsService } from './server-stats.service';
import { GetServer } from '../servers/get-server.decorator';
import { Server } from '../servers/server.entity';
import { PlayerJoinsDto } from './dto/player-joins.dto';
import { UniquePlayerCountDto } from './dto/unique-player-count.dto';
import { PlaytimeDto } from './dto/playtime.dto';
import { UserserverApiAuthGuard } from '@mypvp/userserver-api-auth';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { ServerIdOrAliasParam } from '../servers/server-id-or-alias-param.decorator';
import { HasContext } from '../common/has-context.decorator';
import { LoadServerInterceptor } from '../servers/server.interceptor';
import { ThrowsExceptions } from '../common/throws-exceptions.decorator';

@Controller('servers/:serverIdOrAlias/stats')
@ApiTags('server-stats')
@ApiCookieAuth()
@ApiBearerAuth()
@UseGuards(UserserverApiAuthGuard())
export class ServerStatsController {
  constructor(private readonly serverStats: ServerStatsService) {}

  @Get('top-players')
  @ServerIdOrAliasParam()
  @HasContext()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions()
  getTopPlayers(@GetServer() server: Server): Promise<PlayerPlayTimeDto[]> {
    return this.serverStats.getTopPlayers(server);
  }

  @Get('joins')
  @ServerIdOrAliasParam()
  @HasContext()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions()
  getJoins(@GetServer() server: Server): Promise<PlayerJoinsDto> {
    return this.serverStats.getJoins(server);
  }

  @Get('playtime')
  @ServerIdOrAliasParam()
  @HasContext()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions()
  getPlaytime(@GetServer() server: Server): Promise<PlaytimeDto> {
    return this.serverStats.getPlaytime(server);
  }

  @Get('unique-player-count')
  @ServerIdOrAliasParam()
  @HasContext()
  @UseInterceptors(LoadServerInterceptor)
  @ThrowsExceptions()
  getUniquePlayerCount(
    @GetServer() server: Server,
  ): Promise<UniquePlayerCountDto> {
    return this.serverStats.getUniquePlayerCount(server);
  }
}
