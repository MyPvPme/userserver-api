import { IsNumber, IsUUID } from 'class-validator';

export class PlayerPlayTimeDto {
  @IsUUID()
  userUuid: string;

  @IsNumber()
  playtime: number;
}
