import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiModelPropertyOptional } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { Transform } from 'class-transformer';

export class GetServerExtensionVersionsQueryDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value.split(','))
  @IsOptional()
  @ApiModelPropertyOptional()
  versions: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @ApiModelPropertyOptional()
  withExtensions: boolean;
}
