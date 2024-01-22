import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ServerExtension } from './server-extension.entity';
import { ServerExtensionVersion } from './server-extension-version.entity';
import { ServerExtensionFile } from './server-extension-file.entity';
import { Server } from '../servers/server.entity';
import { SpigotPlugin } from './dto/plugin/spigot-plugin.dto';
import {
  ExtensionsServiceInterface,
  FileTypeEnum,
  PluginInterface,
  RpcServiceManager,
  ServiceType,
} from '@userserver-api/services';
import { AddObservables } from '@userserver-api/type-utils';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { SpigotPluginCommentDto } from './dto/plugin/spigot-plugin-comment.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import * as YAML from 'yaml';
import { SpigotPluginYml } from './dto/plugin/spigot-plugin-yml.dto';
import { ServerExtensionNotFoundException } from './exceptions/server-extension-not-found.exception';
import { MissingPermissionForExtensionException } from './exceptions/missing-permission-for-extension.exception';
import { FileType } from './file-type.enum';
import { EventEmitter2 } from 'eventemitter2';
import * as Sentry from '@sentry/node';
import { ExtensionIsNotCompatibleException } from './exceptions/extension-is-not-compatible.exception';
import { In } from 'typeorm';
import { EventTypeEnum } from '../events/event-type.enum';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';
import { CreateServerExtensionDto } from './dto/create-server-extension.dto';
import { CreateServerExtensionVersionDto } from './dto/create-server-extension-version.dto';
import { CreateServerExtensionFileDto } from './dto/create-server-extension-file.dto';
import { S3 } from 'aws-sdk';
import * as CRC32 from 'crc-32';
import * as AdmZip from 'adm-zip';
import { OnEvent } from '@nestjs/event-emitter';
import { NodesService } from '../nodes/nodes.service';

@Injectable()
export class ServerExtensionsService implements OnModuleInit {
  private readonly logger = new Logger(ServerExtensionsService.name);
  private readonly pluginFileRegex = /^\/[^\/]*\/plugins\/[^\/]*\.jar$/gm;
  private readonly pluginFolderRegex = /^\/[^\/]*\/plugins$/gm;

  private extensionFiles: ServerExtensionFile[] = [];
  private extensions: ServerExtension[] = [];
  private extensionVersions: ServerExtensionVersion[] = [];

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly rpcServiceManager: RpcServiceManager,
    private readonly eventEmitter: EventEmitter2,
    @Inject('S3')
    private readonly s3: S3,
    private readonly nodesService: NodesService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadExtensionFiles();
    await this.loadExtensions();
    await this.loadExtensionVersions();
  }

  private async loadExtensionFiles(): Promise<void> {
    this.extensionFiles = await this.getAllFiles();
  }

  private async loadExtensions(): Promise<void> {
    this.extensions = await this.getAllExtensions();
  }

  private async loadExtensionVersions(): Promise<void> {
    this.extensionVersions = await this.getAllVersions();
  }

  getAllExtensions(): Promise<ServerExtension[]> {
    return ServerExtension.find({
      relations: ['extensionVersions', 'extensionVersions.versions'],
    });
  }

  async getAllExtensionsOrCached(): Promise<ServerExtension[]> {
    return (
      this.extensions ||
      (await ServerExtension.find({
        relations: ['extensionVersions', 'extensionVersions.versions'],
      }))
    );
  }

  getAllVersions(
    versions?: string[],
    relations?: string[],
  ): Promise<ServerExtensionVersion[]> {
    let where;

    if (versions && versions.length > 0) {
      where = {
        versions: {
          name: In(versions),
        },
      };
    }

    return ServerExtensionVersion.find({
      relations: ['versions', ...(relations || [])],
      where,
    });
  }

  async getLatestVersions(
    version: string,
    relations?: string[],
  ): Promise<ServerExtensionVersion[]> {
    const versions = await ServerExtensionVersion.find({
      relations: ['versions', ...(relations || [])],
      where: {
        versions: {
          name: version,
        },
      },
      order: {
        version: 'DESC',
      },
    });

    return versions
      .filter(
        (version, index) =>
          versions.findIndex(
            (value) => version.serverExtensionId === value.serverExtensionId,
          ) === index,
      )
      .sort((a, b) => a.id - b.id);
  }

  getAllFiles(): Promise<ServerExtensionFile[]> {
    return ServerExtensionFile.find();
  }

  async deleteExtensionFromServer(
    server: Server,
    { id: extensionVersionId }: Pick<ServerExtensionVersion, 'id'>,
    user?: User,
  ): Promise<void> {
    const extensionVersion = this.extensionVersions.find(
      (extensionVersion) => extensionVersion.id == extensionVersionId,
    );

    if (!extensionVersion) {
      throw new ServerExtensionNotFoundException(
        `Extension for ${extensionVersionId} not found`,
      );
    }

    const extension = this.extensions.find(
      (extension) => extension.id === extensionVersion.serverExtensionId,
    );

    const installedExtensions = await this.getSpigotPluginsFromServer(
      server,
      false,
    );

    const installedExtension = installedExtensions.find(
      (plugin) => plugin.extensionVersionId === extensionVersionId,
    );

    if (!installedExtension) {
      throw new ServerExtensionNotFoundException(
        `Extension ${extensionVersionId} is not installed`,
      );
    }

    await firstValueFrom(
      (
        await this.getExtensionsServiceForServer({
          id: server.id,
        })
      ).uninstallExtensionVersion({
        serverId: { id: server.id },
        extensionVersion: {
          id: extensionVersionId,
          files: extensionVersion.files.map((file) => ({
            filename: file.name,
            destination: file.path,
            type:
              file.type === FileType.FILE
                ? FileTypeEnum.FILE_TYPE_FILE
                : FileTypeEnum.FILE_TYPE_FOLDER,
          })),
        },
      }),
    );

    await this.cacheManager.del(`server_plugins:${server.id}`);

    if (user)
      this.eventEmitter.emit(
        'extensions.' + EventTypeEnum.USERSERVER_EXTENSION_UNINSTALLED,
        new Event(
          EventTypeEnum.USERSERVER_EXTENSION_UNINSTALLED,
          user.uuid,
          server.id,
          {
            extensionVersion: extensionVersionId.toString(),
            extensionVersionName: extensionVersion.version,
            extensionName: extension.name,
          },
        )
          .addReceivers(user.uuid)
          .addReceiversFromServer(server)
          .addAttributesFromServer(server),
      );
  }

  async installExtensionToServer(
    server: Server,
    { id: extensionVersionId }: Pick<ServerExtensionVersion, 'id'>,
    user?: User,
    force?: boolean,
  ): Promise<void> {
    const extensionVersion = this.extensionVersions.find(
      (extensionVersion) => extensionVersion.id == extensionVersionId,
    );

    if (!extensionVersion) {
      throw new ServerExtensionNotFoundException(
        `Extension for ${extensionVersionId} not found`,
      );
    }

    const extension = this.extensions.find(
      (extension) => extension.id === extensionVersion.serverExtensionId,
    );

    if (
      !extensionVersion.versions.find(
        (version) => version.name === server.versionName,
      ) &&
      !force
    ) {
      throw new ExtensionIsNotCompatibleException(
        'Extension is not with server version compatible',
      );
    }

    if (!server.owner.hasPermission(extension.permission)) {
      throw new MissingPermissionForExtensionException(
        `The owner is missing the permission ${extension.permission}`,
      );
    }

    await firstValueFrom(
      (
        await this.getExtensionsServiceForServer(server)
      ).installExtensionVersion({
        serverId: {
          id: server.id,
        },
        extensionVersion: {
          id: extensionVersionId,
          files: extensionVersion.files.map((file) => ({
            filename: file.name,
            destination: file.path,
            type:
              file.type === FileType.FILE
                ? FileTypeEnum.FILE_TYPE_FILE
                : FileTypeEnum.FILE_TYPE_FOLDER,
          })),
        },
      }),
    );

    extensionVersion.installs++;
    extensionVersion.save().catch((error) => {
      this.logger.error('Could not update installs', error);
      Sentry.captureException(error);
    });

    await this.cacheManager.del(`server_plugins:${server.id}`);

    if (user)
      this.eventEmitter.emit(
        'extensions.' + EventTypeEnum.USERSERVER_EXTENSION_INSTALLED,
        new Event(
          EventTypeEnum.USERSERVER_EXTENSION_INSTALLED,
          user.uuid,
          server.id,
          {
            extensionVersion: extensionVersionId.toString(),
            extensionVersionName: extensionVersion.version,
            extensionName: extension.name,
          },
        )
          .addReceiversFromServer(server)
          .addReceivers(user.uuid)
          .addAttributesFromServer(server),
      );
  }

  async getSpigotPluginsFromServer(
    { id }: Pick<Server, 'id'>,
    withPluginYml: boolean,
  ): Promise<SpigotPlugin[]> {
    let parsedPlugins: SpigotPlugin[];

    const cachedPlugins = await this.cacheManager.get<SpigotPlugin[]>(
      `server_plugins:${id}`,
    );

    if (cachedPlugins) {
      parsedPlugins = [];

      cachedPlugins.forEach((plugin) => {
        if (withPluginYml) {
          parsedPlugins.push(plugin);
        } else {
          parsedPlugins.push({ ...plugin, pluginYml: undefined });
        }
      });
    }

    if (parsedPlugins) return parsedPlugins;

    const plugins = await firstValueFrom(
      (
        await this.getExtensionsServiceForServer({ id })
      ).getAllSpigotPlugins({ id }),
    );

    parsedPlugins = await this.parsePlugins(plugins.plugins || []);

    await this.cacheManager.set(`server_plugins:${id}`, parsedPlugins, {
      ttl: 600,
    });

    return parsedPlugins.map((loadedPlugin) => {
      if (withPluginYml) {
        return { ...loadedPlugin };
      } else {
        return { ...loadedPlugin, pluginYml: undefined };
      }
    });
  }

  async getExtensionsServiceForServer({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
  }: Pick<Server, 'id'>): Promise<AddObservables<ExtensionsServiceInterface>> {
    const node = await this.nodesService.getStorageNodeForServer(id);

    return this.rpcServiceManager.getServiceForNode<
      AddObservables<ExtensionsServiceInterface>
    >(ServiceType.EXTENSIONS, node);
  }

  private async parsePlugins(
    plugins: PluginInterface[],
  ): Promise<SpigotPlugin[]> {
    const pluginsWithComment = await Promise.all(
      plugins.map<Promise<[PluginInterface, SpigotPluginCommentDto?]>>(
        async (plugin) => {
          try {
            if (plugin.comment !== '') {
              const comment = plainToInstance(
                SpigotPluginCommentDto,
                YAML.parse(plugin.comment),
              );
              await validateOrReject(comment);
              return [plugin, comment];
            }
            return [plugin];
          } catch (e) {
            return [plugin];
          }
        },
      ),
    );

    const extensions: [PluginInterface, SpigotPluginCommentDto][] = [];
    const spigotPlugins: PluginInterface[] = [];

    pluginsWithComment.forEach((plugin) => {
      if (plugin.length === 2) {
        extensions.push(plugin as [PluginInterface, SpigotPluginCommentDto]);
      } else {
        spigotPlugins.push(plugin[0]);
      }
    });

    const mappedExtensions = extensions.reduce((prev, current) => {
      (prev[current[1].id] = prev[current[1].id] || []).push(current);
      return prev;
    }, {});

    const parsedPlugins = await Promise.all([
      ...Object.keys(mappedExtensions).map((key) =>
        this.parseSpigotExtension(mappedExtensions[key], +key),
      ),
      ...spigotPlugins.map(this.parseUnknownSpigotPlugin),
    ]);

    return parsedPlugins.flat().filter((plugin) => !!plugin);
  }

  private async parseSpigotExtension(
    plugins: [[PluginInterface, SpigotPluginCommentDto]],
    extensionVersionId: number,
  ): Promise<SpigotPlugin[] | undefined> {
    const extensionFiles = this.extensionFiles.filter(
      (extensionFile) =>
        extensionFile.extensionVersionId === extensionVersionId,
    );

    if (extensionFiles.length !== plugins.length) {
      return Promise.all(
        plugins
          .map<PluginInterface>((plugin) => plugin[0])
          .map(this.parseUnknownSpigotPlugin),
      );
    }

    if (
      plugins.some(([plugin, comment]) => {
        const extensionFile = this.extensionFiles.find(
          (extensionFile) =>
            extensionFile.name === comment.fileName &&
            extensionVersionId === extensionFile.extensionVersionId,
        );

        if (!extensionFile) {
          return true;
        }

        return +extensionFile.checksum !== plugin.crc.toNumber();
      })
    ) {
      return Promise.all(
        plugins
          .map<PluginInterface>((plugin) => plugin[0])
          .map(this.parseUnknownSpigotPlugin),
      );
    }

    const extensionVersion = this.extensionVersions.find(
      (extensionVersion) => extensionVersion.id === extensionVersionId,
    );

    const extension = this.extensions.find(
      (findExtension) => findExtension.id == extensionVersion.serverExtensionId,
    );

    return [
      {
        extensionVersionId,
        extensionId: extension.id,
        name: extension.name,
        version: extensionVersion.version,
        isInSystem: true,
      },
    ];
  }

  public async createExtension(
    createServerExtensionDto: CreateServerExtensionDto,
  ): Promise<ServerExtension> {
    const serverExtension = createServerExtensionDto.toServerExtension();

    await serverExtension.save();

    await this.loadExtensions();

    return serverExtension;
  }

  public async createExtensionVersion(
    createServerExtensionVersion: CreateServerExtensionVersionDto,
    extensionId,
  ): Promise<ServerExtensionVersion> {
    const serverExtension = ServerExtension.findOneBy({ id: extensionId });

    if (!serverExtension)
      throw new ServerExtensionNotFoundException('Extension not found');

    const serverExtensionVersion =
      createServerExtensionVersion.toServerExtensionVersion();

    serverExtensionVersion.serverExtensionId = extensionId;

    await serverExtensionVersion.save();

    return serverExtensionVersion;
  }

  public async createExtensionFile(
    extensionVersionId: number,
    createServerExtensionFileDto: CreateServerExtensionFileDto,
    file: Express.Multer.File,
  ): Promise<ServerExtensionFile> {
    let buffer = file.buffer;

    if (file.originalname.endsWith('.jar')) {
      const zip = new AdmZip(buffer);
      zip.addZipComment(
        `id: ${extensionVersionId}\nfileName: ${createServerExtensionFileDto.name}`,
      );
      buffer = zip.toBuffer();
    }

    await this.s3
      .putObject({
        Body: buffer,
        Bucket: process.env.S3_BUCKET,
        Key: `extensions/${extensionVersionId}/${createServerExtensionFileDto.name}`,
      })
      .promise();

    const serverExtensionFile = new ServerExtensionFile();

    serverExtensionFile.extensionVersionId = extensionVersionId;
    serverExtensionFile.name = createServerExtensionFileDto.name;
    serverExtensionFile.path = createServerExtensionFileDto.path;
    serverExtensionFile.type = FileType.FILE;
    serverExtensionFile.checksum = CRC32.buf(file.buffer) >>> 0;

    await serverExtensionFile.save();

    return serverExtensionFile;
  }

  private async parseUnknownSpigotPlugin(
    plugin: PluginInterface,
  ): Promise<SpigotPlugin | undefined> {
    const parsedPlugin = new SpigotPlugin();

    parsedPlugin.isInSystem = false;

    try {
      const parsedPluginYml = new SpigotPluginYml(YAML.parse(plugin.pluginYml));
      await validateOrReject(parsedPluginYml);
      parsedPlugin.pluginYml = parsedPluginYml;
    } catch (e) {
      return undefined;
    }

    parsedPlugin.name = parsedPlugin?.pluginYml?.name;
    parsedPlugin.version = parsedPlugin?.pluginYml?.version;
    parsedPlugin.fileName = plugin.fileName;

    return parsedPlugin;
  }

  @OnEvent('file.*')
  deleteExtensionCacheOnFileChanged(event: Event): void {
    switch (event.type) {
      case EventTypeEnum.FILE_UPDATED:
      case EventTypeEnum.FILE_RENAMED:
      case EventTypeEnum.FILE_DELETED:
      case EventTypeEnum.FILE_CREATED:
        this.deleteExtensionCacheIfFileIsPlugin(
          event.attributes.path,
          +event.scope,
        );
        break;
      case EventTypeEnum.FOLDER_RENAMED:
      case EventTypeEnum.FOLDER_DELETED:
        this.deleteExtensionCacheIfFolderIsPluginFolder(
          event.attributes.path,
          +event.scope,
        );
        break;
    }
  }

  @OnEvent('extensions.*')
  deleteExtensionCacheOnExtensionChanged(event: Event): void {
    switch (event.type) {
      case EventTypeEnum.USERSERVER_EXTENSION_INSTALLED:
      case EventTypeEnum.USERSERVER_EXTENSION_UNINSTALLED:
        this.cacheManager
          .del(`server_plugins:${event.scope}`)
          .catch((e) =>
            this.logger.error(
              `Plugin cache for server ${event.scope} could not be deleted`,
              e,
            ),
          );
        break;
    }
  }

  private deleteExtensionCacheIfFileIsPlugin(
    path: string,
    serverId: number,
  ): void {
    if (path.match(this.pluginFileRegex)) {
      this.cacheManager
        .del(`server_plugins:${serverId}`)
        .catch((e) =>
          this.logger.error(
            `Plugin cache for server ${serverId} could not be deleted`,
            e,
          ),
        );
    }
  }

  private deleteExtensionCacheIfFolderIsPluginFolder(
    path: string,
    serverId: number,
  ): void {
    if (path.match(this.pluginFolderRegex)) {
      this.cacheManager
        .del(`server_plugins:${serverId}`)
        .catch((e) =>
          this.logger.error(
            `Plugin cache for server ${serverId} could not be deleted`,
            e,
          ),
        );
    }
  }
}
