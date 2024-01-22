import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Server } from './server.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { ServerNotValidException } from './exceptions/server-not-valid.exception';
import { ServerNotFoundException } from './exceptions/server-not-found.exception';
import { User } from '../users/user.entity';
import { ServerVersionsService } from '../server-versions/server-versions.service';
import {
  ContainersServiceInterface,
  ContainerStatusEnum,
  FilesServiceInterface,
  OperationStatusEnum,
  RpcServiceManager,
  ServiceType,
  StatusResponseInterface,
} from '@userserver-api/services';
import { AddObservables } from '@userserver-api/type-utils';
import { ServerStatus } from './server-status.enum';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as Long from 'long';
import { firstValueFrom } from 'rxjs';
import { EventTypeEnum } from '../events/event-type.enum';
import { Event } from '../events/event.entity';
import { ServerPingService } from './server-ping.service';
import { ServerIsNotInRightStateException } from './exceptions/server-is-not-in-right-state.exception';
import { EditServerDto } from './dto/edit-server.dto';
import { getErrorHandlingProxy } from '../common/error-handling-proxy';
import * as Sentry from '@sentry/node';
import { ServerSettingsService } from '../server-settings/server-settings.service';
import { ServerExtensionsService } from '../server-extensions/server-extensions.service';
import { GetServersQueryDto } from './dto/get-servers-query.dto';
import { In, LessThan } from 'typeorm';
import { ServerInfoDto } from './dto/server-info.dto';
import { SetPlayerCountDto } from './dto/set-player-count.dto';
import { SetPlayerCountStrategy } from './set-player-count-strategy.enum';
import { ServerIsFullException } from './exceptions/server-is-full.exception';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { AliasAlreadyInUseException } from './exceptions/alias-already-in-use.exception';
import {
  Configuration,
  MaterialsApi,
  UsersApi,
} from '@mypvp/base-rest-client-nodejs';
import { isNumber } from '@nestjs/common/utils/shared.utils';
import { ServerIdCouldNotBeExtractedException } from './exceptions/server-id-could-not-be-extracted.exception';
import { MinecraftChatFormatService } from '../minecraft-chat-format/minecraft-chat-format.service';
import { OwnerRamLimitReachedException } from './exceptions/owner-ram-limit-reached.exception';
import { SystemCapacityReachedException } from './exceptions/system-capacity-reached.exception';
import { RunnerNode } from '../nodes/runner-node.entity';
import { NodesService } from '../nodes/nodes.service';
import { UserDoesNotHaveThePermissionException } from '../users/exceptions/user-does-not-have-the-permission.exception';

import { Cron } from '@nestjs/schedule';
@Injectable()
export class ServersService implements OnApplicationBootstrap {
  private logger = new Logger(ServersService.name);

  private lastServerActionFrom = new Map<number, string>();

  private statusConnectionRetries = 0;

  private firstConnection = true;

  private readonly userApi: UsersApi;

  private readonly materialsApi: MaterialsApi;

  private minecraftMateriels: string[];

  private readonly restartingServer = new Map<number, { userUuid }>();

  constructor(
    private readonly serverVersionsService: ServerVersionsService,
    private rpcServiceManager: RpcServiceManager,
    private readonly eventEmitter: EventEmitter2,
    private readonly serverPingService: ServerPingService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverExtensionsService: ServerExtensionsService,
    @Inject('BASE_REST_CONFIGURATION')
    private readonly configuration: Configuration,
    private readonly minecraftChatFormatService: MinecraftChatFormatService,
    private readonly nodesService: NodesService,
  ) {
    this.userApi = new UsersApi(configuration);
    this.materialsApi = new MaterialsApi(configuration);
  }

  async onApplicationBootstrap(): Promise<void> {
    const nodes = await RunnerNode.find();
    nodes.forEach((node) => {
      this.connectStatusSubscriber(node.id);
    });
    this.minecraftMateriels = await this.materialsApi.getMaterials();
  }

  private connectStatusSubscriber(nodeId: string): void {
    const service = this.rpcServiceManager.getServiceForNode<
      AddObservables<ContainersServiceInterface>
    >(ServiceType.CONTAINERS, nodeId);

    service.getStatus().subscribe({
      next: (status) => {
        if (this.statusConnectionRetries != 0) {
          this.statusConnectionRetries = 0;
          this.logger.log('Connection to status reestablished');
          this.reloadServerStatus(nodeId)
            .catch((error) => {
              this.logger.error(error);
              Sentry.captureException(error);
            })
            .then(() => {
              this.logger.log('Reloaded server status from node');
            });
        }

        if (this.firstConnection) {
          this.reloadServerStatus(nodeId)
            .catch((error) => {
              this.logger.error(error);
              Sentry.captureException(error);
            })
            .then(() => {
              this.logger.log('Reloaded server status from node');
            });
          this.firstConnection = false;
        }

        this.handleServerStatus(status);
      },
      error: (err) => {
        this.logger.warn(err);
        this.logger.warn(
          `Connection to status rpc is lost try to reconnecting in 5 sec (retried: ${this.statusConnectionRetries})`,
        );
        this.statusConnectionRetries++;
        setTimeout(() => {
          this.connectStatusSubscriber(nodeId);
        }, 1000 * 5);
      },
      complete: () => {
        this.logger.warn(
          `Connection to status rpc is lost try to reconnecting in 5 sec (retried: ${this.statusConnectionRetries})`,
        );
        this.statusConnectionRetries++;
        setTimeout(() => {
          this.connectStatusSubscriber(nodeId);
        }, 1000 * 5);
      },
    });
  }

  private handleServerStatus(status: StatusResponseInterface): void {
    const serverId = status.serverId;

    if (status.statusChange) {
      switch (status.statusChange.status) {
        case ContainerStatusEnum.CONTAINER_STATUS_EXITED:
        case ContainerStatusEnum.CONTAINER_STATUS_COULD_NOT_START:
        case ContainerStatusEnum.CONTAINER_STATUS_STOPPED:
          this.setServerStatus(serverId, ServerStatus.OFFLINE).catch((error) =>
            this.logger.error(error),
          );
          this.serverPingService.removeServer(serverId);
          return;
        case ContainerStatusEnum.CONTAINER_STATUS_STOPPING:
          this.setServerStatus(serverId, ServerStatus.STOPPING).catch((error) =>
            this.logger.error(error),
          );
          this.serverPingService.removeServer(serverId);
          return;
        case ContainerStatusEnum.CONTAINER_STATUS_STARTING:
          this.setServerStatus(serverId, ServerStatus.STARTING).catch((error) =>
            this.logger.error(error),
          );
          return;
        case ContainerStatusEnum.CONTAINER_STATUS_STARTED:
          this.serverPingService.addServer(serverId, {
            host: `${
              process.env.CONTAINER_PREFIX || ''
            }userserver-server-${serverId}`,
            callback: () => {
              this.setServerStatus(serverId, ServerStatus.ONLINE).catch(
                (error) => this.logger.error(error),
              );
            },
            timeoutCallBack: () => {
              this.getContainersServiceForServer({
                id: serverId,
              }).then((service) => {
                firstValueFrom(
                  service.stopContainer({
                    serverId,
                  }),
                ).catch(this.logger.error);
              });
            },
            port: 25565,
            timeout: 120_000,
          });
          return;
      }
    } else if (status.stats) {
    }
  }

  private async setServerStatus(
    serverId: number,
    status: ServerStatus,
  ): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });

    const oldStatus = server.status;

    server.status = status;

    if (status === ServerStatus.ONLINE) {
      server.lastStart = new Date();
    }

    if (status === ServerStatus.OFFLINE) {
      server.playerCount = 0;
    }

    await server.save();

    const lastProducer = this.lastServerActionFrom.get(serverId);

    let producer = 'SYSTEM';

    if (lastProducer) {
      if (
        oldStatus !== ServerStatus.STARTING &&
        status !== ServerStatus.OFFLINE
      )
        producer = lastProducer;

      switch (status) {
        case ServerStatus.OFFLINE:
        case ServerStatus.ONLINE:
        case ServerStatus.QUEUED:
          this.lastServerActionFrom.delete(serverId);
      }
    }

    if (oldStatus !== status)
      this.eventEmitter.emit(
        'server.' + EventTypeEnum.USERSERVER_STATUS_CHANGED,
        new Event(
          EventTypeEnum.USERSERVER_STATUS_CHANGED,
          producer,
          server.id,
          {
            owner: server.ownerUuid,
            status: status,
            serverName: server.name,
            publicStatusAnnounce: server.publicStatusAnnounce.toString(),
          },
        )
          .addAttributesFromServer(server)
          .addReceiversFromServer(server)
          .addReceivers(...(producer === 'SYSTEM' ? [] : [server.ownerUuid])),
      );
  }

  public async startServer(
    { id: serverId }: Pick<Server, 'id'>,
    user: User,
    startCommand?: string,
  ): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });

    if (server.status !== ServerStatus.OFFLINE) {
      throw new ServerIsNotInRightStateException('The server is not offline');
    }

    const onlineServers = await Server.findBy({
      status: In([ServerStatus.ONLINE, ServerStatus.STARTING]),
      ownerUuid: server.ownerUuid,
    });

    let onlineServersRam = 0;

    for (const onlineServer of onlineServers) {
      onlineServersRam += onlineServer.ram;
    }

    if (onlineServersRam + server.ram > server.owner.ramLimit()) {
      throw new OwnerRamLimitReachedException();
    }

    this.lastServerActionFrom.set(serverId, user.uuid);

    const ram = server.ram + Math.min(server.ram * 0.25, 512);

    try {
      await this.serverSettingsService.setDefaultValues(serverId, user);
    } catch (e) {}

    const username = await this.userApi.getNameFromUuid(server.ownerUuid);

    try {
      await firstValueFrom(
        (
          await this.getContainersServiceForServer(server, true)
        ).startContainer({
          serverId: server.id,
          storageNode: server.storageNodeId,
          image: server.version.image,
          ram: Long.fromNumber(ram * 1_000_000),
          startCommand: this.replaceStartCommand(
            startCommand || server.version.startCommand,
            server,
          ),
          env: {
            OWNER_UUID: server.ownerUuid,
            OWNER_NAME: username,
            USERSERVER_ID: server.id.toString(),
          },
        }),
      );
    } catch (e) {
      if (e.details === 'ServerIsFullException') {
        throw new SystemCapacityReachedException();
      }
      throw e;
    }
  }
  public async stopServer(
    { id: serverId }: Pick<Server, 'id'>,
    user?: User,
    restart = false,
  ): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });

    if (server.status !== ServerStatus.ONLINE) {
      throw new ServerIsNotInRightStateException('The server is not online');
    }

    if (user) {
      this.lastServerActionFrom.set(serverId, user.uuid);
    }

    await firstValueFrom(
      (
        await this.getContainersServiceForServer(server)
      ).stopContainer({
        serverId,
      }),
    );

    if (restart && user)
      this.restartingServer.set(serverId, { userUuid: user.uuid });
  }

  @OnEvent('server.' + EventTypeEnum.USERSERVER_STATUS_CHANGED)
  public async restartServer(event: Event): Promise<void> {
    if (
      event.attributes.status === ServerStatus.OFFLINE &&
      this.restartingServer.has(+event.scope)
    ) {
      const restartingServer = this.restartingServer.get(+event.scope);

      const user = await User.findOneBy({ uuid: restartingServer.userUuid });

      this.restartingServer.delete(+event.scope);

      await this.startServer({ id: +event.scope }, user);
    }
  }

  public async createServer(
    createServerDto: CreateServerDto,
    user: User,
  ): Promise<Server> {
    const server = createServerDto.toServer();

    server.owner = user;

    await this.validateServer(server, true);

    await server.save();

    await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).createFolder({
        path: '/' + server.id,
      }),
    );

    const newServer = await Server.findOneBy({ id: server.id });

    this.eventEmitter.emit(
      'server.' + EventTypeEnum.USERSERVER_CREATED,
      new Event(EventTypeEnum.USERSERVER_CREATED, user.uuid, newServer.id, {
        server: JSON.stringify(newServer),
      })
        .addAttributesFromServer(server)
        .addReceivers(user.uuid)
        .addReceiversFromServer(newServer),
    );

    return newServer;
  }

  public async getServerById(id: number, cache?: number): Promise<Server> {
    const server = await Server.findOne({ where: { id }, cache });

    if (!server) {
      throw new ServerNotFoundException(`Server with id ${id} not found`);
    }

    return server;
  }

  public getServerByAlias(alias: string, cache?: number): Promise<Server> {
    return Server.findOne({ where: { alias }, cache });
  }

  public async getServerByAliasOrId(serverIdOrAlias: string): Promise<Server> {
    let server: Server;

    if (isNumber(+serverIdOrAlias) && +serverIdOrAlias > 0) {
      server = await this.getServerById(+serverIdOrAlias, 6000);
    } else if (typeof serverIdOrAlias === 'string') {
      if (!serverIdOrAlias.match(/^[A-Za-zäöüÄÖÜß]+$/)) {
        throw new ServerIdCouldNotBeExtractedException('Alias is invalid');
      }

      server = await this.getServerByAlias(serverIdOrAlias, 6000);
    }

    if (!server) {
      throw new ServerNotFoundException(
        `Server with alias ${serverIdOrAlias} not found`,
      );
    }

    return server;
  }

  public async editServer(
    editServerDto: EditServerDto,
    { id }: Pick<Server, 'id'>,
    user: User,
  ): Promise<Server> {
    const server = await Server.findOneBy({ id });

    const changedKeys: EditServerDto = {};

    Object.keys(editServerDto).forEach((key) => {
      if (editServerDto[key] === null) editServerDto[key] = undefined;

      if (
        editServerDto[key] !== server[key] &&
        editServerDto[key] !== undefined
      ) {
        changedKeys[key] = editServerDto[key];
      }
    });

    Object.assign(server, editServerDto);

    delete server.version;

    await this.validateServer(server);

    await server.save({ reload: true });

    if (Object.keys(changedKeys).length > 0) {
      this.eventEmitter.emit(
        'server.' + EventTypeEnum.USERSERVER_UPDATED,
        new Event(EventTypeEnum.USERSERVER_UPDATED, user.uuid, server.id, {
          changes: JSON.stringify(changedKeys),
        })
          .addAttributesFromServer(server)
          .addReceiversFromServer(server)
          .addReceivers(user.uuid),
      );
    }

    return server;
  }

  private async validateServer(
    server: Server,
    isNewServer = false,
  ): Promise<void> {
    if (server.iconItem && !this.minecraftMateriels.includes(server.iconItem)) {
      throw new ServerNotValidException('Item does not exist');
    }

    await this.serverVersionsService.getVersionByName(server.versionName);

    const serverCount = await Server.count({
      where: { ownerUuid: server.owner.uuid },
    });

    if (isNewServer) {
      if (serverCount + 1 > server.owner.serverLimit()) {
        throw new ServerNotValidException('Max server count is reached');
      }
    }

    if (server.ram > server.owner.ramLimit()) {
      throw new ServerNotValidException('RAM limit is reached');
    }

    if (server.slots > server.owner.slotLimit()) {
      throw new ServerNotValidException('Slots limit is reached');
    }

    if (server.ram < 512) {
      throw new ServerNotValidException('RAM must be greater then 512');
    }

    if (server.shortDescription) {
      await this.minecraftChatFormatService.validateComponent(
        server.shortDescription,
        120,
      );
    }

    if (server.description) {
      await this.minecraftChatFormatService.validateComponent(
        server.description,
      );
    }

    if (server.alias) {
      if (server.alias.match(/^\d*$/)) {
        throw new ServerNotValidException('Alias contains only numbers');
      }

      const serverWithAlias = await Server.findOne({
        where: {
          alias: server.alias,
        },
      });

      if (serverWithAlias && serverWithAlias.id !== server.id) {
        throw new AliasAlreadyInUseException(server.alias);
      }
    }

    if (server.standby) {
      if (!server.owner.hasPermission('userserver.standby')) {
        throw new UserDoesNotHaveThePermissionException(
          'User ' +
            server.owner.uuid +
            ' does not have the permission for stanby',
        );
      }
    }
  }

  async runCommand(serverId: number, command: string): Promise<void> {
    await firstValueFrom(
      (
        await this.getContainersServiceForServer({
          id: serverId,
        })
      ).execCommandToContainer({ command, serverId }),
    );
  }

  async setPlayerCount(
    serverId: number,
    setPlayerCount: SetPlayerCountDto,
  ): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });

    switch (setPlayerCount.strategy) {
      case SetPlayerCountStrategy.ADD:
        server.playerCount += setPlayerCount.playerCount;
        break;
      case SetPlayerCountStrategy.SET:
        server.playerCount = setPlayerCount.playerCount;
        break;
      case SetPlayerCountStrategy.SUBTRACT:
        server.playerCount -= setPlayerCount.playerCount;
        break;
    }

    if (server.playerCount < 0) server.playerCount = 0;
    await server.save();

    this.eventEmitter.emit(
      'server.' + EventTypeEnum.USERSERVER_PLAYER_COUNT_UPDATE,
      new Event(
        EventTypeEnum.USERSERVER_PLAYER_COUNT_UPDATE,
        'SYSTEM',
        server.id,
        {
          playerCount: server.playerCount.toString(),
        },
      ).addAttributesFromServer(server),
    );
  }

  @Cron('*/5 * * * *')
  async archiveOldServers(count = 10): Promise<void> {
    this.logger.debug('Archiving old server');
    const servers = await Server.find({
      where: {
        status: ServerStatus.OFFLINE,
      },
      take: count,
      withDeleted: false,
      order: {
        lastStart: 'ASC',
      },
    });
    for (const server of servers) {
      try {
        await this.archiveServer(server.id);
      } catch (e) {
        this.logger.error(`Could not archive server ${server.id}`, e);
      }
    }
  }

  async archiveServer(serverId: number): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });
    if (server?.status !== ServerStatus.OFFLINE) {
      throw new ServerIsNotInRightStateException('Server must be offline');
    }
    await this.setServerStatus(serverId, ServerStatus.ARCHIVING);

    const extensions =
      await this.serverExtensionsService.getSpigotPluginsFromServer(
        server,
        false,
      );

    const extensionVersions =
      await this.serverExtensionsService.getAllVersions();

    const archiveInformation = {
      extensions: extensions
        .filter((extension) => extension.isInSystem)
        .map((extension) => extension.extensionVersionId)
        .filter((extensionVersionId) =>
          extensionVersions.find(
            (extensionVersion) => extensionVersion.id === extensionVersionId,
          ),
        ),
    };

    const fileService = await this.getFileServiceForServer(server);

    const fileStats = await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).getFileStats({
        path: serverId.toString(),
      }),
    );

    if (!fileStats.exists)
      await firstValueFrom(
        fileService.createFolder({ path: '/' + serverId.toString() }),
      );

    const result = await firstValueFrom(
      fileService.writeFile({
        path: `${serverId}/archive-information.json`,
        content: Buffer.from(JSON.stringify(archiveInformation)),
      }),
    );

    if (
      result.operationStatus ===
      OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR
    ) {
      throw new InternalServerErrorException(
        'Could not write archive information',
      );
    }

    if (archiveInformation.extensions.length > 0)
      await Promise.all(
        archiveInformation.extensions.map((extensionId) =>
          this.serverExtensionsService.deleteExtensionFromServer(server, {
            id: extensionId,
          }),
        ),
      );

    const uploadResult = await firstValueFrom(
      fileService.moveServerToS3({ id: serverId }),
    );

    if (
      uploadResult.operationStatus ===
      OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR
    ) {
      throw new InternalServerErrorException(
        'Could not write archive information',
      );
    }

    const deleteResult = await firstValueFrom(
      fileService.deleteFile({
        path: serverId.toString(),
      }),
    );

    if (
      deleteResult.operationStatus ===
      OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR
    ) {
      throw new InternalServerErrorException(
        'Could not write archive information',
      );
    }

    await this.setServerStatus(serverId, ServerStatus.ARCHIVED);
  }

  async restoreServer(serverId: number): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });
    if (server?.status !== ServerStatus.ARCHIVED) {
      throw new ServerIsNotInRightStateException('Server must be offline');
    }

    await this.setServerStatus(serverId, ServerStatus.RESTORING);

    await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).loadServerFromS3({ id: serverId }),
    );

    const archiveInformation = JSON.parse(
      (
        await firstValueFrom(
          (
            await this.getFileServiceForServer(server)
          ).getFile({
            path: serverId + '/archive-information.json',
          }),
        )
      ).content.toString(),
    ) as { extensions: number[] };

    await Promise.all(
      archiveInformation.extensions.map((extensionId) =>
        this.serverExtensionsService.installExtensionToServer(
          server,
          {
            id: extensionId,
          },
          undefined,
          true,
        ),
      ),
    );

    await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).deleteFile({
        path: serverId + '/archive-information.json',
      }),
    );

    await this.setServerStatus(serverId, ServerStatus.OFFLINE);
  }

  async getServers(filter: GetServersQueryDto): Promise<ServerInfoDto[]> {
    const where: FindOptionsWhere<Server>[] = [{}];

    if (filter.status && filter.status.length > 0)
      where[0].status = In(filter.status);

    if (filter.ownerUuid) where[0].ownerUuid = filter.ownerUuid;

    if (filter.status && filter.status.length > 0 && filter.withStandby) {
      const standByWhere: FindOptionsWhere<Server> = {};

      if (filter.ownerUuid) standByWhere.ownerUuid = filter.ownerUuid;

      standByWhere.standby = true;

      where.push(standByWhere);
    }

    const servers = await Server.find({
      where,
    });

    return servers.map(ServerInfoDto.fromServer);
  }

  async reloadServerStatus(nodeId: string): Promise<void> {
    const service = this.rpcServiceManager.getServiceForNode<
      AddObservables<ContainersServiceInterface>
    >(ServiceType.CONTAINERS, nodeId);

    if (!service) throw new Error();

    const proxiedServer = getErrorHandlingProxy(service);

    const containersList = await firstValueFrom(
      proxiedServer.getRunningContainers({}),
    );

    const servers = await Server.find({
      where: [
        {
          status: ServerStatus.ONLINE,
        },
        {
          status: ServerStatus.STARTING,
        },
        {
          status: ServerStatus.STOPPING,
        },
      ],
    });

    await Promise.all(
      servers.map((server) => {
        if (!(containersList.containers || []).includes(server.id)) {
          return this.setServerStatus(server.id, ServerStatus.OFFLINE);
        }
      }),
    );

    await Promise.all(
      (containersList.containers || []).map((serverId) => {
        return this.setServerStatus(serverId, ServerStatus.ONLINE);
      }),
    );
  }

  async resetServer(serverId: number, user: User): Promise<void> {
    // Reset server in database
    const server = await Server.findOneBy({ id: serverId });

    server.alias = null;
    server.name = 'MyServer';
    server.description = null;
    server.iconItem = 'GRASS_BLOCK';
    server.permissions = [];
    server.domainRecords = [];
    server.shortDescription = null;
    server.allowJoinMe = false;
    server.showJoinMe = false;

    await server.save();

    // Delete files

    await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).deleteFile({
        path: server.id.toString(),
      }),
    );

    await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).createFolder({
        path: server.id.toString(),
      }),
    );

    this.eventEmitter.emit(
      'server.' + EventTypeEnum.USERSERVER_RESET,
      new Event(EventTypeEnum.USERSERVER_RESET, user.uuid, server.id)
        .addReceiversFromServer(server)
        .addReceivers(user.uuid)
        .addAttributesFromServer(server),
    );
  }

  async deleteServer(serverId: number, user: User): Promise<void> {
    // Reset server in database
    const server = await Server.findOneBy({ id: serverId });

    const event = new Event(
      EventTypeEnum.USERSERVER_DELETED,
      user.uuid,
      server.id,
    )
      .addReceivers(user.uuid)
      .addReceiversFromServer(server)
      .addAttributesFromServer(server);

    server.alias = null;
    server.permissions = [];
    server.domainRecords = [];

    const service = await this.getFileServiceForServer(server);

    await server.save();

    await server.softRemove();

    // Delete files

    await firstValueFrom(
      service.deleteFile({
        path: server.id.toString(),
      }),
    );

    this.eventEmitter.emit('server.' + EventTypeEnum.USERSERVER_DELETED, event);
  }

  async joinServer(serverId: number, user: User): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });

    if (
      server.playerCount >= server.slots &&
      !(user.hasPermission('userserver.join') || server.ownerUuid === user.uuid)
    ) {
      throw new ServerIsFullException('Server is full');
    }
    this.eventEmitter.emit(
      'server.' + EventTypeEnum.USERSERVER_JOIN_REQUEST,
      new Event(EventTypeEnum.USERSERVER_JOIN_REQUEST, 'SYSTEM', server.id, {
        userUuid: user.uuid,
      }).addAttributesFromServer(server),
    );
  }

  async getContainersServiceForServer(
    { id }: Pick<Server, 'id'>,
    forceNew = false,
  ): Promise<AddObservables<ContainersServiceInterface>> {
    const node = await this.nodesService.getRunnerNodeForServer(id, forceNew);

    const service = this.rpcServiceManager.getServiceForNode<
      AddObservables<ContainersServiceInterface>
    >(ServiceType.CONTAINERS, node);

    if (!service) return service;

    return getErrorHandlingProxy(service);
  }

  async getFileServiceForServer({
    id,
  }: Pick<Server, 'id'>): Promise<AddObservables<FilesServiceInterface>> {
    const node = await this.nodesService.getStorageNodeForServer(id);

    const service = this.rpcServiceManager.getServiceForNode<
      AddObservables<FilesServiceInterface>
    >(ServiceType.FILES, node);

    if (!service) return service;

    return getErrorHandlingProxy(service);
  }

  private replaceStartCommand(command: string, server: Server): string {
    return command.replaceAll('{ram}', server.ram.toString());
  }
}
