import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import {
  IsArray,
  IsOptional,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator';
import { Server } from '../servers/server.entity';
import { Type } from 'class-transformer';
import { ServerExtensionVersion } from '../server-extensions/server-extension-version.entity';

@Entity('userserver_versions')
export class ServerVersion extends BaseEntity {
  @IsString()
  @PrimaryColumn({ type: 'varchar' })
  name: string;

  @IsString()
  @Column({ type: 'varchar' })
  image: string;

  @IsString()
  @Max(512)
  @Column({ type: 'varchar' })
  startCommand: string;

  @OneToMany(() => Server, (server) => server.version)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Server)
  servers?: Server[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerExtensionVersion)
  @ManyToMany(
    () => ServerExtensionVersion,
    (extensionVersion) => extensionVersion.versions,
  )
  plugins?: ServerExtensionVersion[];
}
