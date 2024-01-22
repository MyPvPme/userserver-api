import { User } from '../users/user.entity';
import { IsDate, IsInt, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Server } from '../servers/server.entity';

@Entity('userserver_user_sessions')
export class UserSession extends BaseEntity {
  @IsInt()
  @PrimaryGeneratedColumn()
  id: number;

  @Type(() => Server)
  @ManyToOne(() => Server, (server) => server.sessions, { eager: true })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @IsInt()
  @Column({ unsigned: true, type: 'int' })
  serverId: number;

  @Type(() => User)
  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'user_uuid' })
  user?: User;

  @IsUUID()
  @Column({ type: 'varchar' })
  userUuid: string;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Column({ type: 'datetime' })
  startDate: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Column({ type: 'datetime' })
  endDate: Date;
}
