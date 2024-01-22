import { ServerSetting } from './server-setting.entity';
import { Server } from '../servers/server.entity';
import { AddObservables } from '@userserver-api/type-utils';
import {
  FilesServiceInterface,
  FileTypeEnum,
  RpcServiceManager,
  ServiceType,
} from '@userserver-api/services';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as Path from 'path';
import * as YAML from 'yaml';
import { Line, parseLines, stringify } from 'dot-properties';
import { ObjectType } from 'typeorm';
import { EventTypeEnum } from '../events/event-type.enum';
import { Event } from '../events/event.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../users/user.entity';
import { NodesService } from '../nodes/nodes.service';

@Injectable()
export class ServerSettingsService {
  constructor(
    private readonly rpcServiceManager: RpcServiceManager,
    private readonly eventEmitter: EventEmitter2,
    private readonly nodesService: NodesService,
  ) {}

  async setDefaultValues(serverId: number, user: User): Promise<void> {
    await this.saveSettings(serverId, user, {
      bungeecord: true,
      onlineMode: false,
      port: 25566,
      serverIp: '127.0.0.1',
      maxPlayers: 9999,
    });
  }

  async saveSettings(
    serverId: number,
    user: User,
    serverSettings: ServerSetting,
  ): Promise<void> {
    const server = await Server.findOneBy({ id: serverId });

    try {
      const properties = (await this.parseServerProperties(serverId)) || [];

      let propertiesChanged = false;

      if (properties) {
        if (serverSettings.maxPlayers !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'max-players',
            serverSettings.maxPlayers,
          );
        }

        if (serverSettings.onlineMode !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'online-mode',
            serverSettings.onlineMode,
          );
        }

        if (serverSettings.port !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'server-port',
            serverSettings.port,
          );
        }

        if (serverSettings.serverIp !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'server-ip',
            serverSettings.serverIp,
          );
        }

        if (serverSettings.whitelist !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'white-list',
            serverSettings.whitelist,
          );
        }

        if (serverSettings.pvp !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(properties, 'pvp', serverSettings.pvp);
        }

        if (serverSettings.difficulty !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'difficulty',
            serverSettings.difficulty,
          );
        }

        if (serverSettings.allowFlight !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'allow-flight',
            serverSettings.allowFlight,
          );
        }

        if (serverSettings.allowNether !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'allow-nether',
            serverSettings.allowNether,
          );
        }

        if (serverSettings.enableCommandBlock !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'enable-command-block',
            serverSettings.enableCommandBlock,
          );
        }

        if (serverSettings.forceGamemode !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'force-gamemode',
            serverSettings.forceGamemode,
          );
        }

        if (serverSettings.gamemode !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'gamemode',
            serverSettings.gamemode,
          );
        }

        if (serverSettings.generateStructures !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'generate-structures',
            serverSettings.generateStructures,
          );
        }

        if (serverSettings.hardcore !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'hardcore',
            serverSettings.hardcore,
          );
        }

        if (serverSettings.spawnAnimals !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'spawn-animals',
            serverSettings.spawnAnimals,
          );
        }

        if (serverSettings.spawnMonsters !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'spawn-monsters',
            serverSettings.spawnMonsters,
          );
        }

        if (serverSettings.spawnNpcs !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'spawn-npcs',
            serverSettings.spawnNpcs,
          );
        }

        if (serverSettings.spawnProtection !== undefined) {
          propertiesChanged = true;

          this.setPropertiesValue(
            properties,
            'spawn-protection',
            serverSettings.spawnProtection,
          );
        }

        await this.setServerProperties(serverId, properties);

        if (propertiesChanged) {
          this.eventEmitter.emit(
            'file.' + EventTypeEnum.FILE_UPDATED,
            new Event(EventTypeEnum.FILE_UPDATED, user.uuid, server.id, {
              path: `/${serverId}/server.properties`,
            })
              .addReceiversFromServer(server)
              .addAttributesFromServer(server),
          );
        }
      }
    } catch (e) {
      console.error(e);
    }

    try {
      let spigotYmlChanged = false;
      const yaml = (await this.parseSpigotYml(serverId)) || {};

      if (yaml) {
        if (serverSettings.bungeecord !== undefined) {
          spigotYmlChanged = true;
          (yaml.settings ??= {}).bungeecord = serverSettings.bungeecord;
        }
        await this.setSpigotYml(serverId, yaml);

        if (spigotYmlChanged) {
          this.eventEmitter.emit(
            'file.' + EventTypeEnum.FILE_UPDATED,
            new Event(EventTypeEnum.FILE_UPDATED, user.uuid, server.id, {
              path: `/${serverId}/spigot.yml`,
            })
              .addReceiversFromServer(server)
              .addAttributesFromServer(server),
          );
        }
      }
    } catch (e) {}

    try {
      let bukkitYmlChanged = false;
      const yaml = (await this.parseBukkitYml(serverId)) || {};

      if (yaml) {
        if (serverSettings.allowEnd !== undefined) {
          bukkitYmlChanged = true;
          (yaml.settings ??= {})['allow-end'] = serverSettings.allowEnd;
        }

        await this.setBukkitYml(serverId, yaml);

        if (bukkitYmlChanged) {
          this.eventEmitter.emit(
            'file.' + EventTypeEnum.FILE_UPDATED,
            new Event(EventTypeEnum.FILE_UPDATED, user.uuid, server.id, {
              path: `/${serverId}/bukkit.yml`,
            })
              .addReceiversFromServer(server)
              .addAttributesFromServer(server),
          );
        }
      }
    } catch (e) {}
  }

  async getSettings(serverId: number): Promise<ServerSetting> {
    const settings = new ServerSetting();

    try {
      const properties = await this.parseServerProperties(serverId);
      if (properties) {
        settings.onlineMode = this.getPropertiesFindValue<boolean>(
          properties,
          'online-mode',
          () => Boolean,
        );

        settings.maxPlayers = this.getPropertiesFindValue<number>(
          properties,
          'max-players',
          () => Number,
        );

        settings.port = this.getPropertiesFindValue<number>(
          properties,
          'server-port',
          () => Number,
        );

        settings.serverIp = this.getPropertiesFindValue<string>(
          properties,
          'server-ip',
          () => String,
        );

        settings.whitelist = this.getPropertiesFindValue<boolean>(
          properties,
          'white-list',
          () => Boolean,
        );

        settings.pvp = this.getPropertiesFindValue<boolean>(
          properties,
          'pvp',
          () => Boolean,
        );

        settings.difficulty = this.getPropertiesFindValue<string>(
          properties,
          'difficulty',
          () => String,
        );

        settings.allowFlight = this.getPropertiesFindValue<boolean>(
          properties,
          'allow-flight',
          () => Boolean,
        );

        settings.allowNether = this.getPropertiesFindValue<boolean>(
          properties,
          'allow-nether',
          () => Boolean,
        );

        settings.enableCommandBlock = this.getPropertiesFindValue<boolean>(
          properties,
          'enable-command-block',
          () => Boolean,
        );

        settings.forceGamemode = this.getPropertiesFindValue<boolean>(
          properties,
          'force-gamemode',
          () => Boolean,
        );

        settings.gamemode = this.getPropertiesFindValue<string>(
          properties,
          'gamemode',
          () => String,
        );

        settings.generateStructures = this.getPropertiesFindValue<boolean>(
          properties,
          'generate-structures',
          () => Boolean,
        );

        settings.hardcore = this.getPropertiesFindValue<boolean>(
          properties,
          'hardcore',
          () => Boolean,
        );

        settings.spawnAnimals = this.getPropertiesFindValue<boolean>(
          properties,
          'spawn-animals',
          () => Boolean,
        );

        settings.spawnMonsters = this.getPropertiesFindValue<boolean>(
          properties,
          'spawn-monsters',
          () => Boolean,
        );

        settings.spawnNpcs = this.getPropertiesFindValue<boolean>(
          properties,
          'spawn-npcs',
          () => Boolean,
        );

        settings.spawnProtection = this.getPropertiesFindValue<number>(
          properties,
          'spawn-protection',
          () => Number,
        );
      }
    } catch (e) {}

    try {
      const spigotYml = await this.parseSpigotYml(serverId);

      if (spigotYml) {
        const bungeecord = spigotYml?.settings?.bungeecord;
        if (typeof bungeecord === 'boolean') {
          settings.bungeecord = bungeecord;
        }
      }
    } catch (e) {}

    try {
      const bukkitYml = await this.parseBukkitYml(serverId);

      if (bukkitYml) {
        const allowEnd = bukkitYml?.settings['allow-end'];
        if (typeof allowEnd === 'boolean') {
          settings.allowEnd = allowEnd;
        }
      }
    } catch (e) {}

    return settings;
  }

  async parseServerProperties(serverId: number): Promise<Line[] | undefined> {
    const service = await this.getFileServiceForServer({ id: serverId });
    const propertiesPath = Path.join(serverId.toString(), 'server.properties');

    try {
      const stats = await firstValueFrom(
        (
          await service
        ).getFileStats({
          path: propertiesPath,
        }),
      );

      if (stats.fileType !== FileTypeEnum.FILE_TYPE_FILE) return undefined;

      if (stats.size.toNumber() > 10000) return undefined;
    } catch (e) {
      return undefined;
    }

    try {
      const fileContent = await this.getFileContent(propertiesPath, service);

      return parseLines(fileContent);
    } catch (e) {
      return undefined;
    }
  }

  async setServerProperties(serverId: number, lines: Line[]): Promise<void> {
    try {
      await this.saveFilContent(
        Path.join(serverId.toString(), 'server.properties'),
        Buffer.from(stringify(lines)),
        await this.getFileServiceForServer({ id: serverId }),
      );
    } catch (e) {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async parseBukkitYml(serverId: number): Promise<any> {
    const service = await this.getFileServiceForServer({ id: serverId });
    const propertiesPath = Path.join(serverId.toString(), 'bukkit.yml');

    try {
      const stats = await firstValueFrom(
        service.getFileStats({
          path: propertiesPath,
        }),
      );

      if (stats.fileType !== FileTypeEnum.FILE_TYPE_FILE) return undefined;

      if (stats.size.toNumber() > 1000) return undefined;
    } catch (e) {
      return undefined;
    }

    try {
      const fileContent = await this.getFileContent(propertiesPath, service);

      return YAML.parse(fileContent);
    } catch (e) {
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setBukkitYml(serverId: number, yaml: any): Promise<void> {
    try {
      await this.saveFilContent(
        Path.join(serverId.toString(), 'bukkit.yml'),
        Buffer.from(YAML.stringify(yaml)),
        await this.getFileServiceForServer({ id: serverId }),
      );
    } catch (e) {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async parseSpigotYml(serverId: number): Promise<any> {
    const service = await this.getFileServiceForServer({ id: serverId });
    const propertiesPath = Path.join(serverId.toString(), 'spigot.yml');

    try {
      const stats = await firstValueFrom(
        service.getFileStats({
          path: propertiesPath,
        }),
      );

      if (stats.fileType !== FileTypeEnum.FILE_TYPE_FILE) return undefined;

      if (stats.size.toNumber() > 10000) return undefined;
    } catch (e) {
      return undefined;
    }

    try {
      const fileContent = await this.getFileContent(propertiesPath, service);

      return YAML.parse(fileContent);
    } catch (e) {
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setSpigotYml(serverId: number, yaml: any): Promise<void> {
    try {
      await this.saveFilContent(
        Path.join(serverId.toString(), 'spigot.yml'),
        Buffer.from(YAML.stringify(yaml)),
        await this.getFileServiceForServer({ id: serverId }),
      );
    } catch (e) {}
  }

  async saveFilContent(
    path: string,
    content: Buffer,
    service: AddObservables<FilesServiceInterface>,
  ): Promise<void> {
    await firstValueFrom(
      service.writeFile({
        path,
        content,
      }),
    );
  }

  private getPropertiesFindValue<T = boolean | string | number>(
    document: Line[],
    key: string,
    typeFunc: () => ObjectType<T>,
  ): T | undefined {
    const keyValuePair = document.find((value) => value[0] === key);
    if (!keyValuePair) return undefined;

    const type = typeFunc();

    switch (type.name) {
      case 'Number':
        return (+keyValuePair[1] || undefined) as unknown as T;
      case 'String':
        return keyValuePair[1] as unknown as T;
      case 'Boolean':
        return ('true' === keyValuePair[1]) as unknown as T;
    }
  }

  private setPropertiesValue(
    document: Line[],
    key: string,
    value: string | number | boolean,
  ): void {
    const keyValuePair = document.find((value) => value[0] === key);
    if (keyValuePair && Array.isArray(keyValuePair)) {
      keyValuePair[1] = value.toString();
      return;
    }

    document.push([key, value.toString()]);
  }

  getFileContent(
    path: string,
    service: AddObservables<FilesServiceInterface>,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const content: Buffer[] = [];

      const response = service.getFile({
        path,
      });

      response.subscribe({
        next: (chunk) => {
          content.push(chunk.content);
        },
        error: (e) => {
          reject(e);
        },
        complete: () => {
          resolve(Buffer.concat(content).toString());
        },
      });
    });
  }

  async getFileServiceForServer({
    id,
  }: Pick<Server, 'id'>): Promise<AddObservables<FilesServiceInterface>> {
    const node = await this.nodesService.getStorageNodeForServer(id);

    return this.rpcServiceManager.getServiceForNode<
      AddObservables<FilesServiceInterface>
    >(ServiceType.FILES, node);
  }
}
