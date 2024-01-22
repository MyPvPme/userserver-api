import { PickType } from '@nestjs/swagger';
import { UserSession } from '../user-session.entity';

export class CreateUserSessionDto extends PickType(UserSession, [
  'serverId',
  'startDate',
  'endDate',
]) {}
