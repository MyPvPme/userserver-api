import { IsNumber } from 'class-validator';

export class UniquePlayerCountDto {
  @IsNumber()
  playerCount: number;
}
