import { Injectable } from '@nestjs/common';
import { CreateServerPermissionDto } from './dto/create-server-permission.dto';
import { ServerPermission } from './server-permission.entity';
import { Server } from '../servers/server.entity';
import { UserCouldNotReceivePermissionException } from './exceptions/user-could-not-receive-permission.exception';
import { DeleteServerPermissionDto } from './dto/delete-server-permission.dto';
import { UserDoNotHaveTheServerPermissionException } from './exceptions/user-do-not-have-the-server-permission.exception';
import { User } from '../users/user.entity';
import { EventTypeEnum } from '../events/event-type.enum';
import { Event } from '../events/event.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserAlreadyHasServerPermissionException } from './exceptions/user-already-has-server-permission.exception';

@Injectable()
export class ServerPermissionsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createServerPermission(
    user: User,
    createServerPermission: CreateServerPermissionDto,
    server: Server,
  ): Promise<ServerPermission> {
    if (server.ownerUuid === createServerPermission.userUuid) {
      throw new UserCouldNotReceivePermissionException(
        'Owner can not receive permissions',
      );
    }

    const existingServerPermission = await ServerPermission.findOneBy({
      serverId: server.id,
      userUuid: createServerPermission.userUuid,
      permission: createServerPermission.permission,
    });

    if (existingServerPermission) {
      throw new UserAlreadyHasServerPermissionException(
        `The user ${user.uuid} has already the permission ${createServerPermission.permission}`,
      );
    }

    const serverPermission = new ServerPermission();

    // Create User if not Exist
    await User.getOrCreateUserByUuid(createServerPermission.userUuid);

    serverPermission.serverId = server.id;
    serverPermission.userUuid = createServerPermission.userUuid;
    serverPermission.permission = createServerPermission.permission;

    const newServerPermission = await serverPermission.save();

    this.eventEmitter.emit(
      'permissions.' + EventTypeEnum.USERSERVER_PERMISSION_ADDED,
      new Event(
        EventTypeEnum.USERSERVER_PERMISSION_ADDED,
        user?.uuid,
        server.id,
        {
          permission: JSON.stringify(newServerPermission),
        },
      )
        .addReceivers(user.uuid, newServerPermission.userUuid)
        .addReceiversFromServer(server)
        .addAttributesFromServer(server),
    );

    return newServerPermission;
  }

  async deleteServerPermission(
    user: User,
    deleteServerPermissionDto: DeleteServerPermissionDto,
    serverId: number,
  ): Promise<void> {
    if (!deleteServerPermissionDto.permission) {
      const permissions = await ServerPermission.find({
        where: {
          serverId,
          userUuid: deleteServerPermissionDto.userUuid,
        },
      });

      if (permissions.length === 0) {
        throw new UserDoNotHaveTheServerPermissionException(
          `User ${deleteServerPermissionDto.userUuid} dose not have any permission`,
        );
      }

      await ServerPermission.remove(permissions);

      let server: Server;

      Server.findOneBy({ id: serverId })
        .then((loadedServer) => {
          server = loadedServer;
        })
        .finally(() => {
          const event = new Event(
            EventTypeEnum.USERSERVER_PERMISSION_REMOVED,
            user?.uuid,
            serverId,
            {
              permission: JSON.stringify(deleteServerPermissionDto),
            },
          ).addReceivers(user.uuid, deleteServerPermissionDto.userUuid);

          if (server) {
            event.addReceiversFromServer(server);
            event.addAttributesFromServer(server);
          }

          this.eventEmitter.emit(
            'permissions.' + EventTypeEnum.USERSERVER_PERMISSION_REMOVED,
            event,
          );
        });

      return;
    }

    const serverPermission = await ServerPermission.findOneBy({
      serverId,
      permission: deleteServerPermissionDto.permission,
      userUuid: deleteServerPermissionDto.userUuid,
    });

    if (!serverPermission) {
      throw new UserDoNotHaveTheServerPermissionException(
        `User ${deleteServerPermissionDto.userUuid} dose not have the permission ${deleteServerPermissionDto.permission}`,
      );
    }

    await serverPermission.remove();

    let server: Server;

    Server.findOneBy({ id: serverId })
      .then((loadedServer) => {
        server = loadedServer;
      })
      .finally(() => {
        const event = new Event(
          EventTypeEnum.USERSERVER_PERMISSION_REMOVED,
          user?.uuid,
          serverId,
          {
            permission: JSON.stringify(deleteServerPermissionDto),
          },
        )
          .addReceivers(user.uuid)
          .addAttributesFromServer(server);

        if (server) {
          event.addReceiversFromServer(server);
        }

        this.eventEmitter.emit(
          'permissions.' + EventTypeEnum.USERSERVER_PERMISSION_REMOVED,
          event,
        );
      });
  }
}
