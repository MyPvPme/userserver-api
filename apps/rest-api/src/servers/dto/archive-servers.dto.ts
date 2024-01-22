import { IsNumber } from 'class-validator';

export class ArchiveServersDto {
  @IsNumber()
  count: number;
}
