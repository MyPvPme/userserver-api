import { Type } from 'class-transformer';
import { ServerInfoDto } from '../../servers/dto/server-info.dto';
import { IsDate, IsInt } from 'class-validator';

export class UserPlaytimeDto {
  @Type(() => ServerInfoDto)
  server: ServerInfoDto;

  @IsInt()
  time: number;

  @IsDate()
  lastJoin: Date;
}
