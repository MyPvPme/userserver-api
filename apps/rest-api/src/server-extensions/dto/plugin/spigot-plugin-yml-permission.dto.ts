import { IsOptional, IsString } from 'class-validator';

export class SpigotPluginYmlPermission {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  default?: string;

  @IsString({ each: true })
  @IsOptional()
  children?: string[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(name: string, yml: any) {
    this.name = name;

    if (!yml) {
      return;
    }

    if (typeof yml['description'] === 'string') {
      this.description = yml['description'];
    }

    if (
      typeof yml['default'] === 'string' ||
      typeof yml['default'] === 'boolean'
    ) {
      this.default = yml['default'].toString();
    }

    if (typeof yml['children'] === 'object') {
      this.children = Object.keys(yml['children']);
    }
  }
}
