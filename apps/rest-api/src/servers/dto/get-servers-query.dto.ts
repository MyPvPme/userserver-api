import { ServerStatus } from '../server-status.enum';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetServersQueryDto {
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

  @IsUUID()
  @IsOptional()
  ownerUuid?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  withStandby?: boolean;
}
