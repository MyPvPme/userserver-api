import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServerDomainRecord } from './server-domain-record.entity';
import {
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@Entity('userserver_domains')
export class ServerDomain extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  @IsString()
  domain: string;

  @Column({ type: 'varchar' })
  @IsString()
  permission: string;

  @CreateDateColumn()
  @IsDate()
  created: Date;

  @DeleteDateColumn()
  @IsString()
  @IsOptional()
  deleted?: Date;

  @OneToMany(
    () => ServerDomainRecord,
    (serverDomainRecord) => serverDomainRecord.domain,
  )
  @Type(() => ServerDomainRecord)
  @IsArray()
  @ValidateNested({ each: true })
  records?: ServerDomainRecord[];
}
