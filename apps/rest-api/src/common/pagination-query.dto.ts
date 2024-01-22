import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationQueryDto {
  @IsInt()
  @Min(0)
  @Transform(({ value }) => +value)
  skip: number;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => +value)
  take: number;
}
