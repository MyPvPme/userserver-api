import { IsInt, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadFileDto {
  @IsInt()
  @Type(() => Number)
  chunkNumber: number;

  @IsInt()
  @Type(() => Number)
  totalChunks: number;

  @IsInt()
  @Type(() => Number)
  chunkSize: number;

  @IsInt()
  @Type(() => Number)
  totalSize: number;

  @IsString()
  @Matches(/^[0-9A-Z\-]+$/i)
  identifier: string;

  @IsString()
  filename: string;

  @IsString()
  relativePath: string;
}
