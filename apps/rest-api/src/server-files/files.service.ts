import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as Path from 'path';
import { ReturnFileDto } from './dto/return-file.dto';
import { Response } from 'express';
import { FileAlreadyExistsException } from './exceptions/file-already-exists.exception';
import { FileDoseNotExistsException } from './exceptions/file-dose-not-exists.exception';
import { PathIsNotInTheRightFormatException } from './exceptions/path-is-not-in-the-right-format.exception';
import { FileOperationIsNotAllowedException } from './exceptions/file-operation-is-not-allowes.exception';
import { FileType } from './file-type.enum';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Server } from '../servers/server.entity';
import { User } from '../users/user.entity';
import { ServerIdCouldNotBeExtractedException } from '../servers/exceptions/server-id-could-not-be-extracted.exception';
import {
  FileChunkInterface,
  FilesServiceInterface,
  FileTypeEnum,
  RpcServiceManager,
  ServiceType,
} from '@userserver-api/services';
import { firstValueFrom, Subject } from 'rxjs';
import { AddObservables } from '@userserver-api/type-utils';
import { EventTypeEnum } from '../events/event-type.enum';
import { Event } from '../events/event.entity';
import * as mime from 'mime-types';
import { UploadFileDto } from './dto/upload-file.dto';
import { Interval } from '@nestjs/schedule';
import { S3 } from 'aws-sdk';
import { GetObjectOutput } from 'aws-sdk/clients/s3';
import * as FS from 'fs';
import { PNG } from 'pngjs';
import * as Sentry from '@sentry/node';
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import * as process from 'process';
import { ServerStatus } from '../servers/server-status.enum';
import { NodesService } from '../nodes/nodes.service';

@Injectable()
export class FilesService implements OnModuleInit {
  private uploads = new Map<
    string,
    {
      serverId: number;
      chunkCount: number;
      uploadStartedChunk: number[];
      uploadedChunks: number[];
      size: number;
      uploadedSize: number;
      relativePath: string;
      maxSizeOfChunk: number;
      lastOperation: number;
    }
  >();
  private readonly logger = new Logger(FilesService.name);
  private standardServerIcon: Buffer;
  private editableFiles: string[] = [
    '.yml',
    '.yaml',
    '.sk',
    '.csv',
    '.json',
    '.txt',
    '.log',
    '.properties',
  ];
  private readonly serverIconRegex = /^\/?[0-9]*\/server-icon\.png/m;
  private readonly influxdbUploadsWriteApi: WriteApi;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private rpcServiceManager: RpcServiceManager,
    private readonly nodesService: NodesService,
    private readonly influxdb: InfluxDB,
    @Inject('S3')
    private readonly s3: S3,
  ) {
    this.influxdbUploadsWriteApi = this.influxdb.getWriteApi(
      process.env.INFLUXDB_ORG,
      process.env.INFLUXDB_BUCKET,
      'ms',
      {
        batchSize: 1,
        flushInterval: 100,
      },
    );
  }

  async onModuleInit(): Promise<void> {
    this.standardServerIcon = await FS.promises.readFile(
      './assets/server-icon.png',
    );
  }

  async getFilesFromPath(
    server: Server,
    pathFile: string,
  ): Promise<ReturnFileDto[]> {
    const returnFiles: ReturnFileDto[] = [];
    const files = await firstValueFrom(
      (await this.getFileServiceForServer(server)).getFiles({ path: pathFile }),
    );

    for (const file of files.fileDetails || []) {
      if (file.fileType === FileTypeEnum.FILE_TYPE_FOLDER) {
        returnFiles.push({
          name: file.name,
          type: FileType.FOLDER,
          path: file.path,
          created:
            file.created.toNumber() === 0
              ? undefined
              : new Date(file.created.toNumber()),
          changed:
            file.changed.toNumber() === 0
              ? undefined
              : new Date(file.changed.toNumber()),
        });
      } else if (file.fileType === FileTypeEnum.FILE_TYPE_FILE) {
        if (this.checkPermissionsForFile(server.owner, file.path, 'VIEW', true))
          returnFiles.push({
            name: file.name,
            type: FileType.FILE,
            path: file.path,
            size: file.size.toNumber(),
            created:
              file.created.toNumber() === 0
                ? undefined
                : new Date(file.created.toNumber()),
            changed:
              file.changed.toNumber() === 0
                ? undefined
                : new Date(file.changed.toNumber()),
            isEditable:
              this.editableFiles.includes(Path.extname(file.name)) &&
              this.checkPermissionsForFile(
                server.owner,
                Path.join(pathFile, file.name),
                'EDIT',
                true,
              ),
            isDownloadable: true,
          });
      }
    }
    return returnFiles;
  }

  async getFileInfo(server: Server, pathFile: string): Promise<ReturnFileDto> {
    const file = await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).getFileStats({ path: pathFile }),
    );

    if (!file.exists) {
      throw new FileDoseNotExistsException(
        `The file ${pathFile} does not exists`,
      );
    }

    if (file.fileType === FileTypeEnum.FILE_TYPE_FOLDER) {
      return {
        name: file.name,
        type: FileType.FOLDER,
        path: file.path,
        created:
          file.created.toNumber() === 0
            ? undefined
            : new Date(file.created.toNumber()),
        changed:
          file.changed.toNumber() === 0
            ? undefined
            : new Date(file.changed.toNumber()),
      };
    } else if (file.fileType === FileTypeEnum.FILE_TYPE_FILE) {
      if (this.checkPermissionsForFile(server.owner, file.path, 'VIEW', true))
        return {
          name: file.name,
          type: FileType.FILE,
          path: file.path,
          size: file.size.toNumber(),
          created:
            file.created.toNumber() === 0
              ? undefined
              : new Date(file.created.toNumber()),
          changed:
            file.changed.toNumber() === 0
              ? undefined
              : new Date(file.changed.toNumber()),
          isEditable:
            this.editableFiles.includes(Path.extname(file.name)) &&
            this.checkPermissionsForFile(
              server.owner,
              Path.join(pathFile, file.name),
              'EDIT',
              true,
            ),
          isDownloadable: true,
        };
    }

    throw new FileDoseNotExistsException(
      `The file ${pathFile} does not exists`,
    );
  }

  async sendFile(
    server: Server,
    path: string,
    response: Response,
    start?: number,
  ): Promise<void> {
    const fileStats = await firstValueFrom(
      (await this.getFileServiceForServer(server)).getFileStats({ path }),
    );

    if (
      !fileStats.exists &&
      fileStats.fileType === FileTypeEnum.FILE_TYPE_FILE
    ) {
      response
        .json(
          new FileDoseNotExistsException(`The file ${path} dose not exists`),
        )
        .sendStatus(404)
        .send();
      return;
    }

    const fileResponse = (await this.getFileServiceForServer(server)).getFile({
      path,
      start,
    });

    response.setHeader(
      'Content-Type',
      mime.lookup(path) || 'application/octet-stream',
    );
    response.setHeader(
      'Content-Length',
      fileStats.size.toNumber() - (start || 0) < 0
        ? 0
        : fileStats.size.toNumber() - (start || 0),
    );

    fileResponse.subscribe({
      next: (value) => {
        response.write(value.content);
      },
      complete: () => {
        response.status(200);
        response.end();
      },
    });
  }

  async sendFolder(
    server: Server,
    path: string,
    response: Response,
  ): Promise<void> {
    const fileResponse = (await this.getFileServiceForServer(server)).getFolder(
      {
        path,
      },
    );
    response.setHeader('Content-Type', 'application/zip');

    fileResponse.subscribe({
      next: (value) => {
        response.write(value.content);
      },
      complete: () => {
        response.status(200);
        response.end();
      },
    });
  }

  async deleteFile(server: Server, path: string, user?: User): Promise<void> {
    await firstValueFrom(
      (await this.getFileServiceForServer(server)).deleteFile({ path }),
    );

    const event = new Event(
      EventTypeEnum.FILE_DELETED,
      user?.uuid || 'SYSTEM',
      server.id,
      {
        path,
      },
    )
      .addReceiversFromServer(server)
      .addAttributesFromServer(server);

    if (user?.uuid) {
      event.addReceivers(user.uuid);
    }

    this.eventEmitter.emit('file.' + EventTypeEnum.FILE_DELETED, event);
  }

  async createFile(server: Server, path: string, user?: User): Promise<void> {
    const fileStats = await firstValueFrom(
      (await this.getFileServiceForServer(server)).getFileStats({ path }),
    );

    if (fileStats.exists)
      throw new FileAlreadyExistsException(`File ${path} already exists`);

    await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).writeFile({
        path,
        content: Buffer.alloc(0),
      }),
    );

    const event = new Event(
      EventTypeEnum.FILE_CREATED,
      user?.uuid || 'SYSTEM',
      server.id,
      {
        path,
      },
    )
      .addReceiversFromServer(server)
      .addAttributesFromServer(server);

    if (user?.uuid) {
      event.addReceivers(user.uuid);
    }

    this.eventEmitter.emit('file.' + EventTypeEnum.FILE_CREATED, event);
  }

  async updateFile(
    server: Server,
    user: User,
    path: string,
    body: string,
  ): Promise<void> {
    await firstValueFrom(
      (
        await this.getFileServiceForServer(server)
      ).writeFile({
        path,
        content: Buffer.from(body),
      }),
    );

    this.eventEmitter.emit(
      'file.' + EventTypeEnum.FILE_UPDATED,
      new Event(EventTypeEnum.FILE_UPDATED, user.uuid, server.id, { path })
        .addReceiversFromServer(server)
        .addAttributesFromServer(server),
    );
  }

  async renameFolder(
    path: string,
    name: string,
    serverId: number,
    user?: User,
  ): Promise<void> {
    const newPath = await this.getFullPath(
      Path.join(Path.dirname(path).replace(/\/\d+/, ''), name),
      serverId,
      false,
      'FOLDER',
      true,
    );

    await firstValueFrom(
      (
        await this.getFileServiceForServer({ id: serverId })
      ).renameFile({
        firstPath: path,
        secondPath: newPath,
      }),
    );

    let server: Server;

    Server.findOneBy({ id: serverId })
      .then((loadedServer) => {
        server = loadedServer;
      })
      .finally(() => {
        const event = new Event(
          EventTypeEnum.FOLDER_RENAMED,
          user?.uuid || 'SYSTEM',
          server.id,
          {
            path,
          },
        )
          .addReceiversFromServer(server)
          .addAttributesFromServer(server);

        if (user?.uuid) {
          event.addReceivers(user.uuid);
        }

        this.eventEmitter.emit('file.' + EventTypeEnum.FOLDER_RENAMED, event);
      });
  }

  async renameFile(
    path: string,
    name: string,
    serverId: number,
    owner: User,
    user?: User,
  ): Promise<void> {
    const newPath = await this.getFullPath(
      Path.join(Path.dirname(path).replace(/\/\d+/, ''), name),
      serverId,
      false,
      'FILE',
      true,
    );
    this.checkPermissionsForFile(owner, newPath, 'CREATE');
    await firstValueFrom(
      (
        await this.getFileServiceForServer({ id: serverId })
      ).renameFile({
        firstPath: path,
        secondPath: newPath,
      }),
    );

    let server: Server;

    Server.findOneBy({ id: serverId })
      .then((loadedServer) => {
        server = loadedServer;
      })
      .finally(() => {
        const event = new Event(
          EventTypeEnum.FILE_RENAMED,
          user?.uuid || 'SYSTEM',
          serverId,
          {
            path,
            name: Path.basename(newPath),
          },
        );

        if (user?.uuid) {
          event.addReceivers(user.uuid);
        }

        this.eventEmitter.emit(
          'file.' + EventTypeEnum.FILE_RENAMED,
          event.addReceiversFromServer(server).addAttributesFromServer(server),
        );
      });
  }

  async deleteFolder(
    server: Pick<Server, 'id'>,
    path: string,
    user?: User,
  ): Promise<void> {
    await firstValueFrom(
      (await this.getFileServiceForServer(server)).deleteFile({ path }),
    );

    let fullServer: Server;

    Server.findOneBy({ id: server.id })
      .then((loadedServer) => {
        fullServer = loadedServer;
      })
      .finally(() => {
        const event = new Event(
          EventTypeEnum.FOLDER_DELETED,
          user?.uuid || 'SYSTEM',
          server.id,
          { path },
        )
          .addReceiversFromServer(fullServer)
          .addAttributesFromServer(fullServer);

        if (user?.uuid) {
          event.addReceivers(user.uuid);
        }

        this.eventEmitter.emit('file.' + EventTypeEnum.FOLDER_DELETED, event);
      });
  }

  async createFolder(
    server: Pick<Server, 'id'>,
    path: string,
    user?: User,
  ): Promise<void> {
    await firstValueFrom(
      (await this.getFileServiceForServer(server)).createFolder({ path }),
    );

    let fullServer: Server;

    Server.findOneBy({ id: server.id })
      .then((loadedServer) => {
        fullServer = loadedServer;
      })
      .finally(() => {
        const event = new Event(
          EventTypeEnum.FOLDER_CREATED,
          user?.uuid || 'SYSTEM',
          server.id,
          { path },
        )
          .addReceiversFromServer(fullServer)
          .addAttributesFromServer(fullServer);

        if (user?.uuid) {
          event.addReceivers(user.uuid);
        }

        this.eventEmitter.emit('file.' + EventTypeEnum.FOLDER_CREATED, event);
      });
  }

  async uploadFileToDestination(
    owner: User,
    uploadFileDto: UploadFileDto,
    file: Express.Multer.File,
    serverId: number,
    user?: User,
  ): Promise<void> {
    if (!this.uploads.has(uploadFileDto.identifier)) {
      if (this.uploads.has(uploadFileDto.identifier)) {
        throw new BadRequestException();
      }

      if (
        !Number.isInteger(uploadFileDto.totalChunks) ||
        uploadFileDto.totalChunks < 1
      ) {
        throw new BadRequestException('Chunk error');
      }

      if (uploadFileDto.chunkSize > 1024 * 1024 * 21) {
        throw new BadRequestException('Chunk is to big');
      }

      if (
        Math.max(
          Math.ceil(uploadFileDto.totalSize / uploadFileDto.chunkSize),
          1,
        ) !== uploadFileDto.totalChunks
      ) {
        throw new BadRequestException('Chunk count is not right');
      }

      if (uploadFileDto.totalSize > 1e9) {
        throw new BadRequestException('File is to big');
      }

      const fullPath = await this.getFullPath(
        uploadFileDto.relativePath,
        serverId,
        false,
        'FILE',
      );

      this.checkPermissionsForFile(owner, fullPath, 'CREATE');

      this.uploads.set(uploadFileDto.identifier, {
        uploadedChunks: [],
        uploadStartedChunk: [],
        chunkCount: uploadFileDto.totalChunks,
        maxSizeOfChunk: uploadFileDto.chunkSize,
        size: uploadFileDto.totalSize,
        relativePath: fullPath,
        uploadedSize: 0,
        lastOperation: Date.now(),
        serverId,
      });
    }

    const upload = this.uploads.get(uploadFileDto.identifier);

    if (
      upload.uploadStartedChunk.includes(uploadFileDto.chunkNumber) ||
      upload.uploadedChunks.includes(uploadFileDto.chunkNumber)
    ) {
      throw new BadRequestException('Chunk is already uploaded');
    }

    if (
      !Number.isInteger(uploadFileDto.chunkNumber) ||
      uploadFileDto.chunkNumber < 0 ||
      uploadFileDto.chunkNumber > upload.chunkCount
    ) {
      throw new BadRequestException('Chunk number is not valid');
    }

    if (file.size > uploadFileDto.chunkSize) {
      throw new BadRequestException('Size is bigger than defined');
    }

    if (uploadFileDto.chunkSize > 1024 * 1024 * 21) {
      throw new BadRequestException('Chunk is to big');
    }

    upload.uploadStartedChunk.push(uploadFileDto.chunkNumber);

    const subject = new Subject<FileChunkInterface>();

    const filesService = await this.getFileServiceForServer({ id: serverId });

    try {
      await new Promise((resolve, reject) => {
        firstValueFrom(filesService.uploadFileChunk(subject.asObservable()))
          .catch(reject)
          .then(resolve);

        let transmittedData = 0;

        const maxChunkSize = 5000;

        do {
          const chunkSize =
            maxChunkSize > file.buffer.length - transmittedData
              ? file.buffer.length - transmittedData
              : maxChunkSize;

          const buffer = file.buffer.subarray(
            transmittedData,
            transmittedData + chunkSize,
          );
          subject.next({
            path: Path.join(
              serverId.toString(),
              uploadFileDto.identifier,
              uploadFileDto.chunkNumber.toString(),
            ),
            content: buffer,
          });

          transmittedData += chunkSize;
        } while (transmittedData !== file.buffer.length);

        subject.complete();
      });
    } finally {
      delete file.buffer;
    }

    const point = new Point('file-chunk-uploads')
      .intField('size', file.size)
      .tag('server', serverId.toString());

    if (user) point.tag('user', user.uuid);

    this.influxdbUploadsWriteApi.writePoint(point);

    upload.uploadedChunks.push(uploadFileDto.chunkNumber);
    upload.lastOperation = Date.now();

    if (upload.uploadedChunks.length === upload.chunkCount) {
      await firstValueFrom(
        (
          await this.getFileServiceForServer({ id: serverId })
        ).completeChunkUpload({
          destination: upload.relativePath,
          path: Path.join(serverId.toString(), uploadFileDto.identifier),
        }),
      );

      this.uploads.delete(uploadFileDto.identifier);

      let server;

      Server.findOneBy({ id: serverId })
        .then((loadedServer) => {
          server = loadedServer;
        })
        .finally(() => {
          const event = new Event(
            EventTypeEnum.FILE_CREATED,
            user?.uuid || 'SYSTEM',
            serverId,
            { path: upload.relativePath },
          ).addAttributesFromServer(server);

          if (user?.uuid) {
            event.addReceivers(user.uuid);
          }

          event.addReceiversFromServer(server);

          this.eventEmitter.emit('file.' + EventTypeEnum.FILE_CREATED, event);
        });
    }
  }

  async getFullPath(
    path: string,
    serverId: number,
    mustExists: boolean,
    type: string,
    shouldNotExist?: boolean,
  ): Promise<string> {
    if (path.includes('..')) {
      throw new PathIsNotInTheRightFormatException('Path contains ..');
    }
    if (!serverId)
      throw new ServerIdCouldNotBeExtractedException('Server id not provided');

    const fullPath = Path.resolve(Path.join('/', serverId.toString(), path));

    const serverRootPath = Path.join('/', serverId.toString());

    if (!fullPath.startsWith(serverRootPath)) {
      throw new PathIsNotInTheRightFormatException(
        'The folder should not be entered',
      );
    }

    const fileLookup = await firstValueFrom(
      (
        await this.getFileServiceForServer({ id: serverId })
      ).getFileStats({
        path: fullPath,
      }),
    );

    if (!fileLookup.exists) {
      if (mustExists !== false)
        throw new FileDoseNotExistsException(`File ${path} not found`);

      return fullPath;
    }

    if (shouldNotExist === true) {
      throw new FileAlreadyExistsException(`File ${path} does already exists`);
    }

    if (type) {
      switch (type) {
        case 'FILE':
          if (fileLookup.fileType !== FileTypeEnum.FILE_TYPE_FILE)
            throw new PathIsNotInTheRightFormatException('Path is no File');
          return fullPath;
        case 'FOLDER':
          if (fileLookup.fileType !== FileTypeEnum.FILE_TYPE_FOLDER)
            throw new PathIsNotInTheRightFormatException('Path is no Folder');
          return fullPath;
        case 'ANY':
          return fullPath;
        default:
          throw new PathIsNotInTheRightFormatException('Path is no Folder');
      }
    } else {
      if (fileLookup.fileType !== FileTypeEnum.FILE_TYPE_FILE)
        throw new PathIsNotInTheRightFormatException('Path is no File');
    }

    return fullPath;
  }

  public checkPermissionsForFile(
    user: User,
    path: string,
    methode: 'VIEW' | 'EDIT' | 'CREATE' | 'DELETE',
    noError?: boolean,
  ): boolean {
    const extension = Path.extname(path);

    if (
      !user.hasPermission(
        `userserver.panel.file.${methode.toLowerCase()}${extension}`,
      )
    ) {
      if (noError) {
        return false;
      } else {
        throw new FileOperationIsNotAllowedException(
          `File is not allowed to ${methode.toLowerCase()}`,
        );
      }
    }
    return true;
  }

  @Interval(1000 * 60)
  async clearUploads(): Promise<void> {
    for (const [key, upload] of this.uploads) {
      if (upload.lastOperation < Date.now() - 120000) {
        (
          await this.getFileServiceForServer({ id: upload.serverId })
        ).deleteTempFolder({
          path: Path.join(upload.serverId.toString(), key),
        });
      }
    }
  }

  async getFileServiceForServer({
    id,
  }: Pick<Server, 'id'>): Promise<AddObservables<FilesServiceInterface>> {
    const node = await this.nodesService.getStorageNodeForServer(id);

    return this.rpcServiceManager.getServiceForNode<
      AddObservables<FilesServiceInterface>
    >(ServiceType.FILES, node);
  }

  async getServerIconOrDefault(serverId: number): Promise<Buffer> {
    let s3Object: GetObjectOutput;

    try {
      s3Object = await this.s3
        .getObject({
          Bucket: process.env.S3_BUCKET,
          Key: `server-icons/${serverId}`,
        })
        .promise();
    } catch (e) {
      if (e?.code === 'NoSuchKey') {
        return this.standardServerIcon;
      }

      throw e;
    }

    return s3Object.Body as Buffer;
  }

  /**
   * Ignores if the server icon does not exist
   */
  async deleteServerIcon(serverId: number): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: process.env.S3_BUCKET,
          Key: `server-icons/${serverId}`,
        })
        .promise();
    } catch (e) {
      if (e?.code === 'NoSuchKey') {
        return;
      }
      throw e;
    }
  }

  async uploadServerIcon(serverId: number): Promise<void> {
    const fileStats = await firstValueFrom(
      (
        await this.getFileServiceForServer({ id: serverId })
      ).getFileStats({
        path: `/${serverId}/server-icon.png`,
      }),
    );

    if (!fileStats.exists) return;

    if (fileStats.size.toNumber() > 1000000) return;

    const file = await this.getFileContent(
      `/${serverId}/server-icon.png`,
      await this.getFileServiceForServer({ id: serverId }),
    );
    let parsedPng: PNG;
    try {
      parsedPng = PNG.sync.read(file);
    } catch (e) {
      return;
    }

    if (parsedPng.height !== 64 || parsedPng.width !== 64) {
      return;
    }

    await this.s3
      .putObject({
        Bucket: process.env.S3_BUCKET,
        Key: `server-icons/${serverId}`,
        Body: file,
      })
      .promise();
  }

  @OnEvent('server.' + EventTypeEnum.USERSERVER_STATUS_CHANGED)
  syncServerIconOnStart(payload: Event): void {
    if (payload.attributes.status === ServerStatus.ONLINE) {
      this.uploadServerIcon(+payload.scope).catch((e) => {
        this.logger.error(
          `Server icon of ${payload.scope} could not be uploaded`,
          e,
        );

        Sentry.captureException(e);
      });
    }
  }

  @OnEvent('file.*')
  syncServerIcon(payload: Event): void {
    switch (payload.type) {
      case EventTypeEnum.FILE_RENAMED: {
        if (this.isServerIconFile(payload.attributes.path)) {
          this.deleteServerIcon(+payload.scope).catch((e) => {
            this.logger.error(
              `Server icon of ${payload.scope} could not deleted`,
              e,
            );

            Sentry.captureException(e);
          });
        } else if (
          this.isServerIconFile(
            Path.join(
              Path.dirname(payload.attributes.path),
              payload.attributes.name,
            ),
          )
        ) {
          this.uploadServerIcon(+payload.scope).catch((e) => {
            this.logger.error(
              `Server icon of ${payload.scope} could not be uploaded`,
              e,
            );

            Sentry.captureException(e);
          });
        }
        return;
      }
      case EventTypeEnum.FILE_DELETED: {
        if (this.isServerIconFile(payload.attributes.path))
          this.deleteServerIcon(+payload.scope).catch((e) => {
            this.logger.error(
              `Server icon of ${payload.scope} could not deleted`,
              e,
            );

            Sentry.captureException(e);
          });
        return;
      }
      case EventTypeEnum.FILE_CREATED:
      case EventTypeEnum.FILE_UPDATED: {
        if (this.isServerIconFile(payload.attributes.path)) {
          this.uploadServerIcon(+payload.scope).catch((e) => {
            this.logger.error(
              `Server icon of ${payload.scope} could not be uploaded`,
              e,
            );

            Sentry.captureException(e);
          });
        }
        return;
      }
      case EventTypeEnum.USERSERVER_DELETED: {
        this.deleteServerIcon(+payload.scope).catch((e) => {
          this.logger.error(
            `Server icon of ${payload.scope} could not deleted`,
            e,
          );

          Sentry.captureException(e);
        });
        return;
      }
    }
  }

  private isServerIconFile(path: string): boolean {
    if (!path) return false;
    if (typeof path !== 'string') return false;

    return this.serverIconRegex.test(path);
  }

  private getFileContent(
    path: string,
    service: AddObservables<FilesServiceInterface>,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
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
          resolve(Buffer.concat(content));
        },
      });
    });
  }
}
