import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServerStatus } from './server-status.enum';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { User } from '../users/user.entity';
import { ServerPermission } from '../server-permissions/server-permission.entity';
import { Type } from 'class-transformer';
import { ServerVersion } from '../server-versions/server-version.entity';
import { ServerDomainRecord } from '../server-domains/server-domain-record.entity';
import { ApiProperty } from '@nestjs/swagger';
import { UserSession } from '../user-sessions/user-session.entity';
import { Optional } from '@nestjs/common';
import { RunnerNode } from '../nodes/runner-node.entity';
import { StorageNode } from '../nodes/storage-node.entity';

@Entity({ name: 'userserver_servers' })
export class Server extends BaseEntity {
  /**
   * The unique id of the server (Always positive)
   */
  @IsNumber()
  @IsPositive()
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The uuid of the Owner
   */
  @IsString()
  @Length(36)
  @Column()
  ownerUuid: string;

  /**
   * The User of the owner
   */
  @ManyToOne(() => User, (user) => user.servers, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'owner_uuid' })
  @Type(() => User)
  owner: User;

  /**
   * The current server status
   */
  @Column({ default: 'OFFLINE', type: 'enum', enum: ServerStatus })
  @IsEnum(ServerStatus)
  status: ServerStatus;

  /**
   * The ram limit of the server
   */
  @IsNumber()
  @Min(0)
  @Column({ type: 'int', default: 512, unsigned: true })
  ram: number;

  /**
   * The slot which the server has
   */
  @IsNumber()
  @Min(0)
  @Column({ type: 'int', default: 5, unsigned: true })
  slots: number;

  /**
   * The name of the Server default MyServer
   */
  @MaxLength(32)
  @IsString()
  @Column({ default: 'MyServer' })
  @ApiProperty({
    name: 'name',
    type: 'string',
    maxLength: 32,
    pattern: '^((?!<[^>]*>).)*$',
  })
  @Matches(/^((?!<[^>]*>).)*$/, { message: 'Server name is invalid' })
  name: string;

  /**
   * The minecraft item which is used as a logo
   * @example SAPLING:3
   */
  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Column({ default: 'GRASS_BLOCK' })
  iconItem: string;

  /**
   * The Description of the server
   */
  @IsString()
  @MaxLength(32768)
  @Column({ nullable: true, default: null })
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(2048)
  @IsOptional()
  @Column({ nullable: true, default: null })
  shortDescription?: string;

  /**
   * The unique alias of the server
   */
  @IsString()
  @IsOptional()
  @MaxLength(16)
  @MinLength(1)
  @ApiProperty({
    required: false,
    type: 'string',
    maxLength: 16,
    pattern: '^[A-Za-zäöüÄÖÜß0-9]+',
  })
  @Matches(/^[A-Za-zäöüÄÖÜß0-9]+$/)
  @Column({ nullable: null, default: null })
  alias?: string;

  /**
   * The date when the server was created
   */
  @IsDate()
  @Column({ default: 'now()' })
  created: Date;

  /**
   * The date when the server was last started
   */
  @IsDate()
  @IsOptional()
  @Column({ nullable: true, default: null })
  lastStart?: Date;

  /**
   * Permissions of users
   */
  @Type(() => ServerPermission)
  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(
    () => ServerPermission,
    (serverPermission) => serverPermission.server,
    { eager: true },
  )
  permissions: ServerPermission[];

  /**
   * The current version of Server
   */
  @ManyToOne(() => ServerVersion, (serverVersion) => serverVersion.name, {
    eager: true,
  })
  @JoinColumn({ name: 'version_name' })
  @Type(() => ServerVersion)
  @ValidateNested()
  version: ServerVersion;

  @IsString()
  @Column({ type: 'varchar' })
  versionName: string;

  @OneToMany(
    () => ServerDomainRecord,
    (serverDomainRecord) => serverDomainRecord.connectedServer,
  )
  domainRecords?: ServerDomainRecord[];

  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  playerCount: number;

  @IsDateString()
  @DeleteDateColumn()
  deletedAt?: Date;

  @Type(() => UserSession)
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(() => UserSession, (userSession) => userSession.server)
  sessions?: UserSession[];

  @IsBoolean()
  @IsOptional()
  @Column({ type: 'boolean', default: false })
  publicStatusAnnounce: boolean;

  @IsOptional()
  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  standby: boolean;

  @IsOptional()
  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  allowJoinMe: boolean;

  @IsOptional()
  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  showJoinMe: boolean;

  @IsString()
  @IsOptional()
  @Column()
  runnerNodeId: string;

  @ManyToOne(() => RunnerNode, (runnerNode) => runnerNode.servers)
  @JoinColumn({ name: 'runner_node_id' })
  @Type(() => User)
  runnerNode: RunnerNode;

  @ManyToOne(() => StorageNode, (storageNode) => storageNode.servers)
  @JoinColumn({ name: 'storage_node_id' })
  @Type(() => User)
  storageNode: StorageNode;

  @IsString()
  @IsOptional()
  @Column()
  storageNodeId: string;

  isArchived(): boolean {
    return [
      ServerStatus.ARCHIVED,
      ServerStatus.ARCHIVING,
      ServerStatus.RESTORING,
    ].includes(this.status);
  }
}
