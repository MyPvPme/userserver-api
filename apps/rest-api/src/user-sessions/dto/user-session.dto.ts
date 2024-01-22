import { OmitType } from '@nestjs/swagger';
import { UserSession } from '../user-session.entity';
import { ServerInfoDto } from '../../servers/dto/server-info.dto';
import { Type } from 'class-transformer';

export class UserSessionDto extends OmitType(UserSession, ['server', 'user']) {
  @Type(() => ServerInfoDto)
  server: ServerInfoDto;

  static fromUserSession(userSession: UserSession): UserSessionDto {
    const userSessionDto = new UserSessionDto();

    userSessionDto.server = ServerInfoDto.fromServer(userSession.server);
    userSessionDto.userUuid = userSession.userUuid;
    userSessionDto.startDate = userSession.startDate;
    userSessionDto.endDate = userSession.endDate;
    userSessionDto.serverId = userSession.serverId;

    return userSessionDto;
  }
}
