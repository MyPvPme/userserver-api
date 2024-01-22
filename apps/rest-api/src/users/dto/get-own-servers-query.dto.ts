import {
  ArrayNotEmpty,
  ArrayUnique,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ServerStatus } from '../../servers/server-status.enum';

export class GetOwnServersQueryDto {
  @Transform((value) =>
    Array.isArray(value.value)
      ? value.value
      : value?.value?.split(',') || undefined,
  )
  @IsOptional()
  @IsEnum(ServerStatus, { each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  status?: ServerStatus[];
}
