import { IsString } from 'class-validator';

export class RunCommandDto {
  @IsString()
  command: string;
}
