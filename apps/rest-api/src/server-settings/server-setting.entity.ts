import { Exclude } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';

export class ServerSetting {
  @IsBoolean()
  @IsOptional()
  whitelist?: boolean;

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsBoolean()
  @IsOptional()
  pvp?: boolean;
  @IsBoolean()
  @IsOptional()
  allowFlight?: boolean;

  @IsBoolean()
  @IsOptional()
  allowNether?: boolean;

  @IsBoolean()
  @IsOptional()
  enableCommandBlock?: boolean;

  @IsBoolean()
  @IsOptional()
  forceGamemode?: boolean;

  @IsString()
  @IsOptional()
  gamemode?: string;

  @IsBoolean()
  @IsOptional()
  generateStructures?: boolean;

  @IsBoolean()
  @IsOptional()
  hardcore?: boolean;

  @IsBoolean()
  @IsOptional()
  spawnAnimals?: boolean;

  @IsBoolean()
  @IsOptional()
  spawnMonsters?: boolean;

  @IsBoolean()
  @IsOptional()
  spawnNpcs?: boolean;

  @IsNumber()
  @IsOptional()
  spawnProtection?: number;

  @IsBoolean()
  @IsOptional()
  allowEnd?: boolean;

  //Internal
  @Exclude()
  @ApiHideProperty()
  bungeecord?: boolean;

  @Exclude()
  @ApiHideProperty()
  port?: number;

  @Exclude()
  @ApiHideProperty()
  onlineMode?: boolean;

  @Exclude()
  @ApiHideProperty()
  serverIp?: string;

  @Exclude()
  @ApiHideProperty()
  maxPlayers?: number;
}
