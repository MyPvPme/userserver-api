import { Component } from './component';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StringComponent extends Component {
  @IsString()
  text: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StringComponent)
  extra?: StringComponent[];
}
