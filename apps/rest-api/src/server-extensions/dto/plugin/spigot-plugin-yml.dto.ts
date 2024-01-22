import { SpigotPluginYmlCommand } from './spigot-plugin-yml-command.dto';
import { SpigotPluginYmlPermission } from './spigot-plugin-yml-permission.dto';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SpigotPluginYml {
  @IsString()
  main: string;

  @IsString()
  name: string;

  @IsString()
  version: string;

  //Optional
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  apiVersion?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: 'string', default: 'POSTWORLD' })
  load = 'POSTWORLD';

  @IsString()
  @IsOptional()
  author?: string;

  @IsString({ each: true })
  @IsOptional()
  authors?: string[];

  @IsString()
  @IsOptional()
  website: string;

  @IsString({ each: true })
  @IsOptional()
  depend?: string[];

  @IsString({ each: true })
  @IsOptional()
  softdepend?: string[];

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsString({ each: true })
  @IsOptional()
  loadbefore?: string[];

  @IsString({ each: true })
  @IsOptional()
  libraries?: string[];

  @Type(() => SpigotPluginYmlCommand)
  @ValidateNested({ each: true })
  commands: SpigotPluginYmlCommand[];

  @Type(() => SpigotPluginYmlPermission)
  @ValidateNested({ each: true })
  permissions: SpigotPluginYmlPermission[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(yml: any) {
    if (typeof yml['main'] === 'string') {
      this.main = yml['main'];
    }

    if (typeof yml['name'] === 'string') {
      this.name = yml['name'];
    }

    if (typeof yml['version'] === 'string') {
      this.version = yml['version'];
    }

    if (typeof yml['description'] === 'string') {
      this.description = yml['description'];
    }

    if (typeof yml['api-version'] === 'string') {
      this.apiVersion = yml['api-version'];
    }

    if (typeof yml['load'] === 'string') {
      this.load = yml['load'];
    }

    if (typeof yml['author'] === 'string') {
      this.author = yml['author'];
    }

    if (Array.isArray(yml['authors'])) {
      if (
        (yml['authors'] as Array<string>).some(
          (author) => typeof author === 'string',
        )
      ) {
      }
      {
        this.authors = yml['authors'];
      }
    }

    if (typeof yml['website'] === 'string') {
      this.website = yml['website'];
    }

    if (Array.isArray(yml['depend'])) {
      if (
        (yml['depend'] as Array<string>).some(
          (depend) => typeof depend === 'string',
        )
      ) {
      }
      {
        this.depend = yml['depend'];
      }
    }

    if (Array.isArray(yml['softdepend'])) {
      if (
        (yml['softdepend'] as Array<string>).some(
          (softdepend) => typeof softdepend === 'string',
        )
      ) {
      }
      {
        this.softdepend = yml['softdepend'];
      }
    }

    if (typeof yml['prefix'] === 'string') {
      this.prefix = yml['prefix'];
    }

    if (Array.isArray(yml['loadbefore'])) {
      if (
        (yml['loadbefore'] as Array<string>).some(
          (loadbefore) => typeof loadbefore === 'string',
        )
      ) {
      }
      {
        this.loadbefore = yml['loadbefore'];
      }
    }

    if (Array.isArray(yml['libraries'])) {
      if (
        (yml['libraries'] as Array<string>).some(
          (libraries) => typeof libraries === 'string',
        )
      ) {
      }
      {
        this.libraries = yml['libraries'];
      }
    }

    this.commands = [];

    if (typeof yml['commands'] === 'object') {
      Object.keys(yml['commands']).forEach((key) => {
        this.commands.push(
          new SpigotPluginYmlCommand(key, yml['commands'][key]),
        );
      });
    }

    this.permissions = [];

    if (typeof yml['permissions'] === 'object') {
      Object.keys(yml['permissions']).forEach((key) => {
        this.permissions.push(
          new SpigotPluginYmlPermission(key, yml['permissions'][key]),
        );
      });
    }
  }
}
