import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Server } from '../servers/server.entity';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { Optional } from '@nestjs/common';
import { ServerPermission } from '../server-permissions/server-permission.entity';
import { ServerDomainRecord } from '../server-domains/server-domain-record.entity';
import { ApiProperty } from '@nestjs/swagger';
import { UserSession } from '../user-sessions/user-session.entity';

@Entity('userserver_users')
export class User extends BaseEntity {
  /**
   * The Minecraft player uuid
   */
  @Length(36)
  @PrimaryColumn({ length: 36 })
  uuid: string;

  /**
   * The purchased ram in mb
   */
  @IsNumber()
  @Min(0)
  @Column({ type: 'int', unsigned: true, default: 0 })
  purchasedRam: number;

  /**
   * The purchased slots
   */
  @IsNumber()
  @Min(0)
  @Column({ type: 'int', unsigned: true, default: 0 })
  purchasedSlots: number;

  /**
   * Indicates if the user is blocked from the Userserver system
   */
  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  blocked: boolean;

  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  allowDomainRecordTransfer: boolean;

  /**
   * All the servers of the user
   */
  @Type(() => Server)
  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(() => Server, (server) => server.owner)
  servers?: Server[];

  /**
   * The groups in which the user is
   */
  @IsArray()
  @ValidateNested({ each: true })
  groups: string[];

  /**
   * The permission which the user has
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) =>
    value.filter(
      (permission) =>
        permission.startsWith('userserver.') || permission === '*',
    ),
  )
  permissions: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(() => UserSession, (userSession) => userSession.user)
  @IsOptional()
  sessions?: UserSession[];

  @Type(() => ServerPermission)
  @IsArray()
  @ValidateNested({ each: true })
  @OneToMany(
    () => ServerPermission,
    (serverPermissions) => serverPermissions.user,
  )
  serverPermissions?: ServerPermission[];

  @OneToMany(
    () => ServerDomainRecord,
    (serverDomainRecord) => serverDomainRecord.owner,
  )
  domainRecords?: ServerDomainRecord[];

  public hasPermission(permission: string): boolean {
    if (this.permissions?.length === 0) {
      return false;
    }

    return this.permissions.some((permissionToCheck) => {
      if (permissionToCheck.endsWith('*')) {
        return permission.startsWith(permissionToCheck.slice(0, -1));
      } else {
        return permissionToCheck === permission;
      }
    });
  }

  @ApiProperty({ name: 'serverLimit', type: 'number' })
  @Expose()
  public serverLimit(): number {
    let serverCount = 2;

    if (this.hasPermission('userserver.admin.server.limit'))
      serverCount = 99999;
    else if (this.hasPermission('userserver.legend')) serverCount = 6;
    else if (this.hasPermission('userserver.premium')) serverCount = 3;

    return serverCount;
  }

  @ApiProperty({ name: 'ramLimit', type: 'number' })
  @Expose()
  public ramLimit(): number {
    let ramLimit = 512 + this.purchasedRam;

    if (this.hasPermission('userserver.admin.server.ram')) ramLimit += 999999;
    else if (this.hasPermission('userserver.legend')) ramLimit += 1024;
    else if (this.hasPermission('userserver.premium')) ramLimit += 512;

    return ramLimit;
  }

  @ApiProperty({ name: 'slotLimit', type: 'number' })
  @Expose()
  public slotLimit(): number {
    let slotsLimit = 5 + this.purchasedSlots;

    if (this.hasPermission('userserver.admin.server.slots')) slotsLimit = 99999;
    else if (this.hasPermission('userserver.legend')) slotsLimit += 10;
    else if (this.hasPermission('userserver.premium')) slotsLimit += 5;

    return slotsLimit;
  }

  @ApiProperty({ name: 'domainRecordLimit', type: 'number' })
  @Expose()
  public domainRecordLimit(): number {
    let domainRecordLimit = 2;

    if (this.hasPermission('userserver.admin.domain.records'))
      domainRecordLimit = 99999;
    else if (this.hasPermission('userserver.legend')) domainRecordLimit += 3;
    else if (this.hasPermission('userserver.premium')) domainRecordLimit += 1;

    return domainRecordLimit;
  }

  // Entity API Methods
  static async getOrCreateUserByUuid(uuid: string): Promise<User> {
    let user = await User.findOneBy({ uuid });
    if (!user) {
      user = new User();

      user.uuid = uuid;

      await user.save();
    }

    return user;
  }
}
