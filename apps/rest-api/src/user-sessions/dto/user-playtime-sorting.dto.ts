import { IsEnum, IsOptional } from 'class-validator';
import { SortingOrderEnum } from '../../common/sorting-order.enum';

export class UserPlaytimeSortingDto {
  @IsEnum(SortingOrderEnum)
  @IsOptional()
  time?: SortingOrderEnum;

  @IsEnum(SortingOrderEnum)
  @IsOptional()
  lastJoin?: SortingOrderEnum;
}
