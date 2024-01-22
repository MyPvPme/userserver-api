import { BaseEntity, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Server } from '../servers/server.entity';
import { ServerPermissions } from './server-permissions.enum';
import { User } from '../users/user.entity';

@Entity('userserver_server_permissions')
export class ServerPermission extends BaseEntity {
  /**
   * The Server
   */
  @ManyToOne(() => Server, (server) => server.permissions, {
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'server_id' })
  @Type(() => Server)
  server?: Server;

  @ManyToOne(() => User, (user) => user.serverPermissions)
  @JoinColumn({ name: 'user_uuid' })
  @Type(() => User)
  user?: User;

  @IsEnum(ServerPermissions)
  @Column({ type: 'enum', enum: ServerPermissions, primary: true })
  permission: ServerPermissions;

  /**
   * The Server ID
   */
  @Column({ type: 'int', unsigned: true, primary: true })
  @IsNumber()
  serverId: number;

  @Column({ type: 'string', length: 36, primary: true })
  @IsUUID()
  userUuid: string;
}
