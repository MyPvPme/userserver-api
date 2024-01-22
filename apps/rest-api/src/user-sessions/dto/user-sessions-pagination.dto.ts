import { PaginationResponseInterface } from '../../common/pagination-response.interface';
import { UserSessionDto } from './user-session.dto';
import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UserSessionsPaginationDto
  implements PaginationResponseInterface<UserSessionDto>
{
  @IsInt()
  count: number;

  @Type(() => UserSessionDto)
  @IsArray()
  data: UserSessionDto[];
}
