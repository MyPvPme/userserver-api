import { IsUUID } from 'class-validator';

export class ReturnSessionDto {
  @IsUUID()
  token: string;
}
