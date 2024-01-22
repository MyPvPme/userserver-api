import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServerExtensionFile } from './server-extension-file.entity';
import { ServerExtension } from './server-extension.entity';
import { ServerVersion } from '../server-versions/server-version.entity';

@Entity('userserver_extension_versions')
export class ServerExtensionVersion extends BaseEntity {
  @IsNumber()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  @IsString()
  version: string;

  @Type(() => ServerExtension)
  @ValidateNested()
  @ManyToOne(
    () => ServerExtension,
    (serverPlugin) => serverPlugin.extensionVersions,
  )
  @JoinColumn({ name: 'server_extension_id' })
  serverExtension?: ServerExtension;

  @IsNumber()
  @Column()
  serverExtensionId: number;

  @Type(() => ServerExtensionVersion)
  @ValidateNested({ each: true })
  @OneToMany(
    () => ServerExtensionFile,
    (serverPluginFile) => serverPluginFile.serverExtensionVersion,
    { eager: true },
  )
  files: ServerExtensionFile[];

  @Type(() => ServerVersion)
  @IsArray()
  @ValidateNested({ each: true })
  @ManyToMany(() => ServerVersion, (serverVersion) => serverVersion.plugins)
  @JoinTable({
    name: 'userserver_extensions_versions_versions',
    joinColumn: {
      name: 'extension_version_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'version_name',
      referencedColumnName: 'name',
    },
  })
  versions?: ServerVersion[];

  @IsArray()
  @Type(() => ServerExtensionVersion)
  @ValidateNested({ each: true })
  @ManyToMany(() => ServerExtensionVersion)
  @JoinTable({
    name: 'userserver_extension_version_depends',
    joinColumn: { name: 'extension_version', referencedColumnName: 'version' },
    inverseJoinColumn: {
      name: 'depend_extension_version',
      referencedColumnName: 'version',
    },
  })
  depends?: ServerExtensionVersion[];

  /**
   * The count how often this Version was installed (no reduction)
   */
  @IsNumber()
  @Column({ type: 'int', default: 0 })
  installs: number;

  @IsDateString()
  @Column({ type: 'datetime' })
  released: Date;

  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @IsDate()
  @DeleteDateColumn()
  deletedAt: Date;
}
