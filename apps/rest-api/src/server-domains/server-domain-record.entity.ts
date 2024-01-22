import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Server } from '../servers/server.entity';
import { ServerDomain } from './server-domain.entity';
import { IsAlphanumeric, IsDate, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

@Entity('userserver_domain_records')
export class ServerDomainRecord extends BaseEntity {
  @PrimaryGeneratedColumn()
  @IsNumber()
  id: number;

  @Column({ type: 'varchar' })
  @IsString()
  @IsAlphanumeric()
  record: string;

  @Column({ type: 'varchar' })
  @IsString()
  ownerUuid: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_uuid' })
  @Type(() => User)
  owner?: User;

  @Column({ type: 'int', unsigned: true })
  @IsNumber()
  connectedServerId?: number;

  @ManyToOne(() => Server, (server) => server.domainRecords)
  @JoinColumn({ name: 'connected_server_id' })
  @Type(() => Server)
  connectedServer?: Server;

  @Column({ type: 'int', unsigned: true })
  @IsNumber()
  domainId: number;

  @ManyToOne(() => ServerDomain, (serverDomain) => serverDomain.records, {
    eager: true,
  })
  @JoinColumn({ name: 'domain_id' })
  @Type(() => ServerDomain)
  domain: ServerDomain;

  @Column({ type: 'timestamp' })
  @IsDate()
  created: Date;
}
