import { IsOptional, IsString } from 'class-validator';

export class SpigotPluginYmlCommand {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString({ each: true })
  @IsOptional()
  aliases: string[];

  @IsString()
  @IsOptional()
  permission: string;

  @IsString()
  @IsOptional()
  permissionMessage: string;

  @IsString()
  @IsOptional()
  usage: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(name: string, yml: any) {
    this.name = name;

    if (!yml) {
      return;
    }

    if (typeof yml['description'] === 'string') {
      this.description = yml['description'];
    }

    if (Array.isArray('aliases')) {
      if (
        (yml['aliases'] as Array<string>).some(
          (depend) => typeof depend === 'string',
        )
      ) {
      }
      {
        this.aliases = yml['aliases'];
      }
    }

    if (typeof yml['permission'] === 'string') {
      this.permission = yml['permission'];
    }

    if (typeof yml['permission-message'] === 'string') {
      this.permissionMessage = yml['permission-message'];
    }
    if (typeof yml['usage'] === 'string') {
      this.usage = yml['usage'];
    }
  }
}
