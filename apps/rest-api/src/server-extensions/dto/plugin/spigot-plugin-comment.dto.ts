import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SpigotPluginCommentDto {
  @IsString()
  @IsOptional()
  fileName: string;

  @IsNumber()
  id: number;
}
