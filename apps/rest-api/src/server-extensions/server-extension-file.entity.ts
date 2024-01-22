import { ServerExtensionVersion } from './server-extension-version.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Exclude, Type } from 'class-transformer';
import { FileType } from './file-type.enum';
import { IsEnum, IsInt, IsString } from 'class-validator';

@Entity('userserver_extension_files')
export class ServerExtensionFile extends BaseEntity {
  @IsString()
  @PrimaryColumn({ type: 'varchar' })
  name: string;

  @PrimaryColumn()
  extensionVersionId: number;

  @Exclude()
  @ManyToOne(
    () => ServerExtensionVersion,
    (serverExtensionVersion) => serverExtensionVersion.files,
  )
  @JoinColumn({ name: 'extension_version_id' })
  @Type(() => ServerExtensionVersion)
  serverExtensionVersion?: ServerExtensionVersion;

  @IsString()
  @Column({ type: 'varchar' })
  path: string;

  @IsEnum(FileType)
  @Column({ type: 'enum', enum: FileType })
  type: FileType;

  @Column({ type: 'int', unsigned: true, nullable: true })
  @IsInt()
  checksum?: number;
}
