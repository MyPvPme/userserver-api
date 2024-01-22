import { Injectable } from '@nestjs/common';
import { UserSessionDto } from './dto/user-session.dto';
import { CreateUserSessionDto } from './dto/create-user-session.dto';
import { UserSession } from './user-session.entity';
import { Server } from '../servers/server.entity';
import { ServerNotFoundException } from '../servers/exceptions/server-not-found.exception';
import { EndDateIsNotGraterThanStartDateException } from './exceptions/end-date-is-not-grater-than-start-date.exception';
import { UserSessionsPaginationDto } from './dto/user-sessions-pagination.dto';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { UserPlaytimePaginationDto } from './dto/user-playtime-pagination.dto';
import { UserPlaytimeDto } from './dto/user-playtime.dto';
import { ServerInfoDto } from '../servers/dto/server-info.dto';
import { camelCase } from 'typeorm/util/StringUtils';
import { UserPlaytimeSortingDto } from './dto/user-playtime-sorting.dto';
import { SortingOrderEnum } from '../common/sorting-order.enum';

@Injectable()
export class UserSessionsService {
  async getSessionsForUser(
    userUuid: string,
    pagination: PaginationQueryDto,
  ): Promise<UserSessionsPaginationDto> {
    const [sessions, count] = await UserSession.findAndCount({
      where: { userUuid },
      skip: pagination.skip,
      take: pagination.take,
      withDeleted: true,
    });

    return { data: sessions.map(UserSessionDto.fromUserSession), count };
  }

  async createSession(
    userUuid: string,
    createUserSessionDto: CreateUserSessionDto,
  ): Promise<void> {
    if (createUserSessionDto.startDate >= createUserSessionDto.endDate) {
      throw new EndDateIsNotGraterThanStartDateException(
        'End date must be grater then start date',
      );
    }

    const server = await Server.findOneBy({
      id: createUserSessionDto.serverId,
    });

    if (!server) {
      throw new ServerNotFoundException(
        `Server with id: ${server.id} not found`,
      );
    }

    const userSession = new UserSession();

    userSession.userUuid = userUuid;
    userSession.serverId = server.id;
    userSession.endDate = createUserSessionDto.endDate;
    userSession.startDate = createUserSessionDto.startDate;

    await userSession.save();
  }

  async getPlaytimeForUser(
    userUuid: string,
    pagination: PaginationQueryDto,
    sorting: UserPlaytimeSortingDto,
  ): Promise<UserPlaytimePaginationDto> {
    const userPlaytimePaginationDto = new UserPlaytimePaginationDto();

    const count = await UserSession.query(
      'SELECT COUNT(DISTINCT server_id) as count ' +
        'FROM userserver_user_sessions ' +
        'WHERE user_uuid = ?',
      [userUuid],
    );

    userPlaytimePaginationDto.count = +count[0].count;

    if (userPlaytimePaginationDto.count === 0) {
      userPlaytimePaginationDto.data = [];
      return userPlaytimePaginationDto;
    }

    const query = await UserSession.query(
      'SELECT server.*, MAX(start_date) as lastJoin, SUM(TIMESTAMPDIFF(MINUTE, start_date, end_date)) as time ' +
        'FROM userserver_user_sessions LEFT JOIN userserver_servers as server ON server.id = server_id ' +
        'WHERE user_uuid = ? GROUP BY server_id' +
        this.getSortByForPlaytime(sorting) +
        ' LIMIT ?, ?',
      [userUuid, pagination.skip, pagination.take],
    );

    userPlaytimePaginationDto.data = query
      .map((value) => {
        const newObject = {};

        Object.keys(value).forEach((key) => {
          let currentValue = value[key];

          if (key === 'standby') {
            currentValue = value[key] === 1;
          }

          if (key === 'show_join_me') {
            currentValue = value[key] === 1;
          }

          if (key === 'allow_join_me') {
            currentValue = value[key] === 1;
          }

          newObject[camelCase(key)] = currentValue;
        });

        return newObject;
      })
      .map((value: Server & { lastJoin: Date; time: number }) => {
        const userPlaytime = new UserPlaytimeDto();
        userPlaytime.lastJoin = value.lastJoin;
        userPlaytime.time = +value.time;

        userPlaytime.server = ServerInfoDto.fromServer(value);

        return userPlaytime;
      });

    return userPlaytimePaginationDto;
  }

  private getSortByForPlaytime(sorting: UserPlaytimeSortingDto): string {
    const query: string[] = [];

    if (sorting.time) {
      query.push(`time ${SortingOrderEnum[sorting.time]}`);
    }

    if (sorting.lastJoin) {
      query.push(`lastJoin ${SortingOrderEnum[sorting.lastJoin]}`);
    }

    if (query.length === 0) {
      return '';
    }

    return ' ORDER BY ' + query.join(', ');
  }
}
