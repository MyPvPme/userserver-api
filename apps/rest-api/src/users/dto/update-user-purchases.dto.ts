import { IsNumber, IsOptional } from 'class-validator';

export class UpdateUserPurchasesDto {
  @IsNumber()
  @IsOptional()
  ram: number;

  @IsNumber()
  @IsOptional()
  slots: number;
}
