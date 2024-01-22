import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServerExtensionVersion } from './server-extension-version.entity';
import {
  IsBoolean,
  IsDate,
  IsEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ServerExtensionType } from './server-extension-type.enum';
import { Type } from 'class-transformer';

@Entity('userserver_extensions')
export class ServerExtension extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @IsEnum(ServerExtensionType)
  @Column({ type: 'enum', enum: ServerExtensionType })
  type: ServerExtensionType;

  @IsString()
  @Column({ type: 'varchar' })
  permission: string;

  @Type(() => ServerExtension)
  @ValidateNested()
  @ManyToOne(() => ServerExtension)
  @JoinColumn({ name: 'deprecated_thru_id' })
  deprecatedThru?: ServerExtension;

  @IsOptional()
  @IsNumber()
  @Column({ type: 'int' })
  deprecatedThruId?: number;

  @IsString()
  @Column({ type: 'varchar' })
  menuItem: string;

  @OneToMany(
    () => ServerExtensionVersion,
    (serverExtensionVersion) => serverExtensionVersion.serverExtension,
  )
  extensionVersions?: ServerExtensionVersion[];

  @IsDate()
  @IsEmpty()
  @DeleteDateColumn()
  deletedAt: Date;

  @IsDate()
  @IsEmpty()
  @CreateDateColumn()
  createdAt: Date;

  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  isPublic: boolean;
}
