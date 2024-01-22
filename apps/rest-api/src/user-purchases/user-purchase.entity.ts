import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { UserPurchaseTypeEnum } from './user-purchase-type.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString } from 'class-validator';

@Entity('userserver_user_purchases')
export class UserPurchase extends BaseEntity {
  @PrimaryGeneratedColumn()
  @IsInt()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_uuid' })
  @Type(() => User)
  user: User;

  @Column({ type: 'varchar' })
  @IsString()
  userUuid: number;

  @Column({ type: 'enum', enum: UserPurchaseTypeEnum })
  @IsEnum(UserPurchaseTypeEnum)
  type: UserPurchaseTypeEnum;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'datetime', default: 'NOW()' })
  createdAt: Date;

  @Column({ type: 'datetime' })
  expiresAt: Date;
}
