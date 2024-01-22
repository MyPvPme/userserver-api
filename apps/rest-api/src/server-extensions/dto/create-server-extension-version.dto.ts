import { PickType } from '@nestjs/swagger';
import { ServerExtensionVersion } from '../server-extension-version.entity';
import { IsArray, IsInt, IsString } from 'class-validator';
import { ServerVersion } from '../../server-versions/server-version.entity';

export class CreateServerExtensionVersionDto extends PickType(
  ServerExtensionVersion,
  ['version', 'released'],
) {
  @IsArray()
  @IsString({ each: true })
  versions: string[];

  @IsArray()
  @IsInt({ each: true })
  depends: number[];
  public toServerExtensionVersion(): ServerExtensionVersion {
    const serverExtensionVersion = new ServerExtensionVersion();
    serverExtensionVersion.version = this.version;
    serverExtensionVersion.versions = this.versions.map((version) => ({
      name: version,
    })) as unknown as ServerVersion[];
    serverExtensionVersion.depends = this.depends.map((version) => ({
      id: version,
    })) as unknown as ServerExtensionVersion[];
    serverExtensionVersion.released = this.released;
    return serverExtensionVersion;
  }
}
