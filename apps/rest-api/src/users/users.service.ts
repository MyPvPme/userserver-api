import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Server } from '../servers/server.entity';
import { GetOwnServersQueryDto } from './dto/get-own-servers-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { ServerPermission } from '../server-permissions/server-permission.entity';
import { In } from 'typeorm';
import { UpdateUserPurchasesDto } from './dto/update-user-purchases.dto';

@Injectable()
export class UsersService {
  async getOrCreateUserByUuid(uuid: string): Promise<User> {
    let user = await User.findOne({ where: { uuid }, cache: 6000 });
    if (!user) {
      user = new User();

      user.uuid = uuid;

      await user.save();
    }

    return user;
  }

  async addUserPurchases(
    uuid: string,
    updateUserPurchasesDto: UpdateUserPurchasesDto,
  ): Promise<User> {
    const user = await User.findOneBy({ uuid });
    if (!user) {
      throw new UserNotFoundException(`User ${uuid} not found`);
    }

    if (updateUserPurchasesDto.ram) {
      user.purchasedRam += updateUserPurchasesDto.ram;
    }

    if (updateUserPurchasesDto.slots) {
      user.purchasedSlots += updateUserPurchasesDto.slots;
    }

    await user.save();

    return user;
  }

  async updateUser(uuid: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await User.findOneBy({ uuid });
    if (!user) {
      throw new UserNotFoundException(`User ${uuid} not found`);
    }

    user.allowDomainRecordTransfer = updateUserDto.allowDomainRecordTransfer;

    return user.save();
  }

  async getAllServersOfUser(
    { uuid }: User,
    filter: GetOwnServersQueryDto,
  ): Promise<Server[]> {
    const user = await User.findOne({
      where: {
        uuid,
      },
      relations: ['servers'],
    });

    const permissions = await ServerPermission.createQueryBuilder('permission')
      .select('permission.server_id as permission_server_id')
      .where('permission.user_uuid = :uuid', { uuid })
      .groupBy('permission.server_id')
      .getRawMany();

    const serversWithPermissions = await Server.findBy({
      id: In(
        permissions.map(({ permission_server_id }) => permission_server_id),
      ),
    });

    const servers = [
      ...user.servers,
      ...serversWithPermissions.filter(
        (server, index) =>
          !user.servers.find((fServer) => fServer.id === server.id) &&
          serversWithPermissions.findIndex(
            (fServer) => fServer.id === server.id,
          ) === index,
      ),
    ];

    if (filter.status && filter.status.length > 0) {
      return servers.filter((server) => filter.status.includes(server.status));
    } else {
      return servers;
    }
  }
}
