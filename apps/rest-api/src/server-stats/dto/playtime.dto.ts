import { IsNumber } from 'class-validator';

export class PlaytimeDto {
  @IsNumber()
  playtime: number;
}
