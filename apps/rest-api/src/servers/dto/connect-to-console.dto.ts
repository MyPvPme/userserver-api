import { IsNumber, IsPositive, IsString } from 'class-validator';

export class ConnectToConsoleDto {
  @IsString()
  serverIdOrAlias: string;

  @IsNumber()
  @IsPositive()
  height: number;

  @IsNumber()
  @IsPositive()
  width: number;
}
