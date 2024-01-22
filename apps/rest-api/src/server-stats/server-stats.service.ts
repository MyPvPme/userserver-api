import { Injectable } from '@nestjs/common';
import { UserSession } from '../user-sessions/user-session.entity';
import { Server } from '../servers/server.entity';
import { PlayerPlayTimeDto } from './dto/player-play-time.dto';
import { PlaytimeDto } from './dto/playtime.dto';
import { UniquePlayerCountDto } from './dto/unique-player-count.dto';
import { PlayerJoinsDto } from './dto/player-joins.dto';

@Injectable()
export class ServerStatsService {
  async getTopPlayers(server: Server): Promise<PlayerPlayTimeDto[]> {
    return (
      await UserSession.query(
        'SELECT user_uuid, SUM(TIMESTAMPDIFF(MINUTE, start_date, end_date)) as playtime FROM `userserver_user_sessions` WHERE server_id = ? GROUP BY user_uuid ORDER BY playtime DESC LIMIT 20;',
        [server.id],
      )
    ).map((result) => ({
      userUuid: result.user_uuid,
      playtime: result.playtime,
    }));
  }

  async getPlaytime(server: Server): Promise<PlaytimeDto> {
    return {
      playtime:
        +(
          await UserSession.query(
            'SELECT SUM(TIMESTAMPDIFF(MINUTE, start_date, end_date)) as playtime FROM `userserver_user_sessions` WHERE server_id = ?',
            [server.id],
          )
        )[0]?.playtime || 0,
    };
  }

  async getUniquePlayerCount(server: Server): Promise<UniquePlayerCountDto> {
    return {
      playerCount:
        +(
          await UserSession.query(
            'SELECT COUNT(DISTINCT user_uuid) as playerCount FROM `userserver_user_sessions` WHERE server_id = ?',
            [server.id],
          )
        )[0]?.playerCount || 0,
    };
  }

  async getJoins(server: Server): Promise<PlayerJoinsDto> {
    return {
      joins:
        +(
          await UserSession.query(
            'SELECT COUNT(*) as joins FROM `userserver_user_sessions` WHERE server_id = ?',
            [server.id],
          )
        )[0]?.joins || 0,
    };
  }
}
