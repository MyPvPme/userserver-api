import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectServerDomainRecordDto {
  // Use property severIdOrAlias
  @IsNumber()
  @IsOptional()
  @ApiProperty({ deprecated: true })
  serverId?: number;

  @IsString()
  @IsOptional()
  serverIdOrAlias?: string;
}
