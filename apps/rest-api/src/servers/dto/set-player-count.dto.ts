import { PickType } from '@nestjs/swagger';
import { Server } from '../server.entity';
import { IsEnum } from 'class-validator';
import { SetPlayerCountStrategy } from '../set-player-count-strategy.enum';

export class SetPlayerCountDto extends PickType(Server, ['playerCount']) {
  @IsEnum(SetPlayerCountStrategy)
  strategy: SetPlayerCountStrategy;
}
