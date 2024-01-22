import { Injectable } from '@nestjs/common';
import { ServerDomain } from './server-domain.entity';
import { CreateServerDomainDto } from './dto/create-server-domain.dto';
import { EditServerDomainDto } from './dto/edit-server-domain.dto';
import { EventEmitter2 } from 'eventemitter2';
import { EventTypeEnum } from '../events/event-type.enum';
import { Event } from '../events/event.entity';
import { UserserverDomainNotFoundException } from './exceptions/userserver-domain-not-found.exception';
import { User } from '../users/user.entity';
import { ServerDomainRecord } from './server-domain-record.entity';
import { UserserverDomainRecordNotFoundException } from './exceptions/userserver-domain-record-not-found.exception';
import { UserDoesNotHaveThePermissionException } from '../users/exceptions/user-does-not-have-the-permission.exception';
import { CreateServerDomainRecordDto } from './dto/create-server-domain-record.dto';
import { UserserverDomainRecordAlreadyExistsException } from './exceptions/userserver-domain-record-already-exists.exception';
import { ServerPermissions } from '../server-permissions/server-permissions.enum';
import { UserMissingServerPermissionException } from '../servers/exceptions/user-missing-server-permission.exception';
import { isAlphanumeric, isInt } from 'class-validator';
import { ServersService } from '../servers/servers.service';
import { TransferServerDomainRecordDto } from './dto/transfer-server-domain-record.dto';
import { UserNotFoundException } from '../users/exceptions/user-not-found.exception';
import { UserDoesNotAllowDomainRecordTransfersException } from './exceptions/user-does-not-allow-domain-record-transfers.exception';
import { UserserverDomainRecordLimitReachedException } from './exceptions/userserver-domain-record-limit-reached.exception';

@Injectable()
export class ServerDomainsService {
  constructor(
    private readonly evenEmitter: EventEmitter2,
    private readonly serversService: ServersService,
  ) {}

  async connectDomainRecord(
    serverIdOrAlias: string,
    recordId: number,
    user: User,
  ): Promise<ServerDomainRecord> {
    const domainRecord = await ServerDomainRecord.findOneBy({ id: recordId });

    if (!domainRecord)
      throw new UserserverDomainRecordNotFoundException(
        `Domain record wirth id: ${recordId} not found`,
      );

    if (domainRecord.ownerUuid !== user.uuid) {
      throw new UserDoesNotHaveThePermissionException(`User is not the owner`);
    }

    const server = await this.serversService.getServerByAliasOrId(
      serverIdOrAlias,
    );

    if (
      !server.permissions.find(
        (serverPermission) =>
          serverPermission.permission === ServerPermissions.SERVER_PROPERTIES &&
          serverPermission.userUuid === user.uuid,
      ) &&
      server.ownerUuid !== user.uuid
    ) {
      throw new UserMissingServerPermissionException(
        `User do not have the ${ServerPermissions.SERVER_PROPERTIES} permission`,
      );
    }

    domainRecord.connectedServerId = server.id;

    await domainRecord.save();

    this.evenEmitter.emit(
      'userserver_domains.' + EventTypeEnum.USERSERVER_DOMAIN_RECORD_CONNECTED,
      new Event(
        EventTypeEnum.USERSERVER_DOMAIN_RECORD_CONNECTED,
        user.uuid,
        domainRecord.id,
        {
          serverId: server.id.toString(),
        },
      )
        .addReceivers(user.uuid)
        .addReceiversFromServer(server)
        .addAttributesFromServer(server),
    );

    return domainRecord;
  }

  async disconnectDomainRecord(recordId: number, user: User): Promise<void> {
    const domainRecord = await ServerDomainRecord.findOne({
      where: { id: recordId },
      relations: ['connectedServer'],
    });

    if (!domainRecord)
      throw new UserserverDomainRecordNotFoundException(
        `Domain record wirth id: ${recordId} not found`,
      );

    if (domainRecord.ownerUuid !== user.uuid) {
      throw new UserDoesNotHaveThePermissionException(`User is not the owner`);
    }

    if (!domainRecord.connectedServerId) {
      return;
    }

    const server = domainRecord.connectedServer;

    domainRecord.connectedServerId = null;
    domainRecord.connectedServer = null;

    await domainRecord.save();

    this.evenEmitter.emit(
      'userserver_domains.' +
        EventTypeEnum.USERSERVER_DOMAIN_RECORD_DISCONNECTED,
      new Event(
        EventTypeEnum.USERSERVER_DOMAIN_RECORD_DISCONNECTED,
        user.uuid,
        domainRecord.id,
        {
          serverId: server.id.toString(),
        },
      )
        .addReceivers(user.uuid)
        .addReceiversFromServer(server)
        .addAttributesFromServer(server),
    );
  }

  async registerDomainRecord(
    createServerDomainRecord: CreateServerDomainRecordDto,
    user: User,
  ): Promise<ServerDomainRecord> {
    const domainCountOfUser = await ServerDomainRecord.count({
      where: { ownerUuid: user.uuid },
    });

    if (domainCountOfUser >= user.domainRecordLimit())
      throw new UserserverDomainRecordLimitReachedException(
        'The target user has reached the domain record limit',
      );

    const domain = await ServerDomain.findOneBy({
      id: createServerDomainRecord.domainId,
    });

    if (!domain)
      throw new UserserverDomainNotFoundException(
        `Domain with id: ${createServerDomainRecord.domainId} not found`,
      );

    if (!user.hasPermission(domain.permission)) {
      throw new UserDoesNotHaveThePermissionException(
        `User does not have the permission ${domain.permission}`,
      );
    }

    const searchedRecord = await ServerDomainRecord.findOne({
      where: {
        domainId: createServerDomainRecord.domainId,
        record: createServerDomainRecord.record,
      },
    });

    if (searchedRecord) {
      throw new UserserverDomainRecordAlreadyExistsException(
        `Record is already in use`,
      );
    }

    const domainRecord = createServerDomainRecord.toServerDomainRecord();
    domainRecord.ownerUuid = user.uuid;
    domainRecord.domainId = domain.id;

    await domainRecord.save({ reload: true });

    const newDomainRecord = await ServerDomainRecord.findOneBy({
      id: domainRecord.id,
    });

    this.evenEmitter.emit(
      'userserver_domains.' + EventTypeEnum.USERSERVER_DOMAIN_RECORD_CREATED,
      new Event(
        EventTypeEnum.USERSERVER_DOMAIN_RECORD_CREATED,
        user.uuid,
        domainRecord.id,
      ).addReceivers(user.uuid),
    );

    return newDomainRecord;
  }

  async deleteDomainRecord(id: number, user: User): Promise<void> {
    const domainRecord = await ServerDomainRecord.findOneBy({ id });

    if (!domainRecord)
      throw new UserserverDomainRecordNotFoundException(
        `Domain record wirth id: ${id} not found`,
      );

    if (domainRecord.ownerUuid !== user.uuid) {
      throw new UserDoesNotHaveThePermissionException(`User is not the owner`);
    }

    await domainRecord.remove();

    this.evenEmitter.emit(
      'userserver_domains.' + EventTypeEnum.USERSERVER_DOMAIN_RECORD_DELETED,
      new Event(
        EventTypeEnum.USERSERVER_DOMAIN_RECORD_DELETED,
        user.uuid,
        id,
      ).addReceivers(user.uuid),
    );
  }

  async transferDomainRecord(
    recordId: number,
    user: User,
    transferDomainRecordDto: TransferServerDomainRecordDto,
  ): Promise<void> {
    const domainRecord = await ServerDomainRecord.findOneBy({ id: recordId });

    if (!domainRecord)
      throw new UserserverDomainRecordNotFoundException(
        `Domain record wirth id: ${recordId} not found`,
      );

    if (domainRecord.ownerUuid !== user.uuid) {
      throw new UserserverDomainRecordNotFoundException(
        `Domain record wirth id: ${recordId} not found`,
      );
    }

    const targetUser = await User.findOneBy({
      uuid: transferDomainRecordDto.receiverUuid,
    });

    if (!targetUser) {
      throw new UserNotFoundException(
        `The user ${transferDomainRecordDto.receiverUuid} dose not exist`,
      );
    }

    if (!targetUser.allowDomainRecordTransfer) {
      throw new UserDoesNotAllowDomainRecordTransfersException(
        'The user does not allow domain record transfers',
      );
    }

    if (!targetUser.hasPermission(domainRecord.domain.permission)) {
      throw new UserDoesNotHaveThePermissionException(
        `Receiver does not have the permission ${domainRecord.domain.permission}`,
      );
    }

    const [, domainRecordCount] = await ServerDomainRecord.findAndCountBy({
      ownerUuid: transferDomainRecordDto.receiverUuid,
    });

    if (domainRecordCount + 1 > targetUser.domainRecordLimit()) {
      throw new UserserverDomainRecordLimitReachedException(
        'The target user has reached the domain record limit',
      );
    }

    delete domainRecord.owner;
    domainRecord.ownerUuid = transferDomainRecordDto.receiverUuid;
    await domainRecord.save();

    this.evenEmitter.emit(
      `userserver_domains.${EventTypeEnum.USERSERVER_DOMAIN_RECORD_TRANSFERRED}`,
      new Event(
        EventTypeEnum.USERSERVER_DOMAIN_RECORD_TRANSFERRED,
        user.uuid,
        domainRecord.id,
        {
          receiverUuid: transferDomainRecordDto.receiverUuid,
          fullDomain: `${domainRecord.record}.${domainRecord.domain.domain}`,
        },
      ).addReceivers(user.uuid, transferDomainRecordDto.receiverUuid),
    );
  }

  async getAllDomains(): Promise<ServerDomain[]> {
    return ServerDomain.find();
  }

  async createDomain(
    createServerDomainDto: CreateServerDomainDto,
  ): Promise<ServerDomain> {
    const domain = await createServerDomainDto.toServerDomain().save();

    this.evenEmitter.emit(
      'userserver_domains.' + EventTypeEnum.USERSERVER_DOMAIN_ADDED,
      new Event(EventTypeEnum.USERSERVER_DOMAIN_ADDED, 'SYSTEM', domain.id),
    );

    return domain;
  }

  async editDomain(
    editServerDomainDto: EditServerDomainDto,
    domainId: number,
  ): Promise<ServerDomain> {
    const domain = await ServerDomain.findOneBy({ id: domainId });

    if (!domain)
      throw new UserserverDomainNotFoundException(
        `Domain with id: ${domainId} not found`,
      );

    Object.assign(domain, editServerDomainDto);

    await domain.save({ reload: true });

    return domain;
  }

  async deleteDomain({ id }: Pick<ServerDomain, 'id'>): Promise<void> {
    const domain = await ServerDomain.findOneBy({ id });

    if (!domain)
      throw new UserserverDomainNotFoundException(
        `Domain with id: ${id} not found`,
      );

    await domain.softRemove();
  }

  async getDomainRecord(
    domainId: number,
    record: string,
  ): Promise<ServerDomainRecord> {
    const domain = await ServerDomain.findOneBy({ id: domainId });
    if (!domain)
      throw new UserserverDomainNotFoundException(
        `Domain ${domainId} not found`,
      );

    let domainRecord: ServerDomainRecord;

    if (isInt(+record)) {
      domainRecord = await ServerDomainRecord.findOne({
        where: { domainId: domain.id, id: +record },
        relations: ['connectedServer'],
      });
    } else if (isAlphanumeric(record)) {
      domainRecord = await ServerDomainRecord.findOne({
        where: { domainId: domain.id, record },
        relations: ['connectedServer'],
      });
    }

    if (!domainRecord)
      throw new UserserverDomainRecordNotFoundException(
        `Domain record ${record} not found`,
      );

    return domainRecord;
  }
}
