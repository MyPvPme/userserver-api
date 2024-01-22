import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class Component {
  @IsOptional()
  @IsBoolean()
  bold?: boolean;
  @IsOptional()
  @IsBoolean()
  italic?: boolean;
  @IsOptional()
  @IsBoolean()
  underlined?: boolean;

  @IsOptional()
  @IsBoolean()
  strikethrough?: boolean;

  @IsOptional()
  @IsBoolean()
  obfuscated?: boolean;

  @IsOptional()
  @IsString()
  font?: 'minecraft:uniform' | 'minecraft:alt' | 'minecraft:default';

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  insertion?: string;

  extra?: Component[];
}
