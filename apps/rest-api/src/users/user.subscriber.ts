import { Connection, EntitySubscriberInterface, InsertEvent } from 'typeorm';
import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { User } from './user.entity';
import {
  Configuration,
  GroupsApi,
  BaseGroup,
} from '@mypvp/base-rest-client-nodejs';
import { Cache } from 'cache-manager';
import { BaseGroupUser } from '@mypvp/base-rest-client-nodejs/models/BaseGroupUser';

@Injectable()
export class UserSubscriber implements EntitySubscriberInterface, OnModuleInit {
  private groupsApi: GroupsApi;
  private groups: BaseGroup[] = [];

  constructor(
    @InjectConnection()
    readonly connection: Connection,
    @Inject('BASE_REST_CONFIGURATION')
    private readonly configuration: Configuration,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    connection.subscribers.push(this);
    this.groupsApi = new GroupsApi(configuration);
  }

  listenTo(): typeof User {
    return User;
  }

  async afterLoad(entity: User): Promise<void> {
    await this.setPermission(entity);
  }

  async afterInsert(event: InsertEvent<User>): Promise<void> {
    await this.setPermission(event.entity);
  }

  private async setPermission(user: User): Promise<void> {
    let userGroups = await this.cacheManager.get<BaseGroupUser>(
      `${user.uuid}:groups`,
    );

    if (!userGroups) {
      userGroups = await this.groupsApi.getUsersGroups(user.uuid);
      await this.cacheManager.set(`${user.uuid}:groups`, userGroups, {
        ttl: 3600,
      });
    }

    user.groups = userGroups.groups.map(
      ({ id: groupId }) =>
        this.groups.find((group) => group.id == groupId).name,
    );

    user.permissions = userGroups.groups.reduce(
      (prev, current) => [
        ...prev,
        ...this.groups.find((group) => group.id === current.id).permissions,
        ...(this.groups.find((group) => group.id === current.id)
          .inheritancePermissions || []),
      ],
      [],
    );
  }

  async onModuleInit(): Promise<void> {
    this.groups = await this.groupsApi.getAllGroups();
  }
}
