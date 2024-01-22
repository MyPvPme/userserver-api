import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsDate, IsUUID } from 'class-validator';

@Entity({ name: 'userserver_api_tokens' })
export class Token extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  token: string;

  @Column()
  @IsUUID()
  uuid: string;

  @CreateDateColumn()
  @IsDate()
  created: Date;
}
