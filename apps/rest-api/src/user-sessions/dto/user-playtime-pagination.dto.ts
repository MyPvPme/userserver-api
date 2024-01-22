import { PaginationResponseInterface } from '../../common/pagination-response.interface';
import { UserPlaytimeDto } from './user-playtime.dto';
import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UserPlaytimePaginationDto
  implements PaginationResponseInterface<UserPlaytimeDto>
{
  @IsInt()
  count: number;

  @Type(() => UserPlaytimeDto)
  @IsArray()
  data: UserPlaytimeDto[];
}
