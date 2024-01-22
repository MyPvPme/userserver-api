import { Controller, Inject, Logger } from '@nestjs/common';
import {
  CompleteChunkInterface,
  FileChunkInterface,
  FileDetailsInterface,
  FileDetailsListInterface,
  FilePathInterface,
  FilesServiceInterface,
  FileTypeEnum,
  GetFileInterface,
  OperationStatusEnum,
  OperationStatusResponseInterface,
  ServerIdInterface,
} from '@userserver-api/services';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import * as Path from 'path';
import * as FS from 'fs';
import { AddOptionalPromise } from '@userserver-api/type-utils';
import * as crypto from 'crypto';
import { Observable, Subject } from 'rxjs';
import { FilePathsInterface } from '@userserver-api/services/dto/file-paths.interface';
import * as Sentry from '@sentry/node';
import * as archiver from 'archiver';
import * as AWS from 'aws-sdk';
import { async as StreamZipAsync } from 'node-stream-zip';
import * as Long from 'long';

@Controller()
export class FilesService implements AddOptionalPromise<FilesServiceInterface> {
  private readonly logger = new Logger(FilesService.name);
  readonly basePath = '/home/servers';

  constructor(@Inject('S3') private readonly s3Client: AWS.S3) {}

  @GrpcMethod()
  async deleteFile(
    filePath: FilePathInterface,
  ): Promise<OperationStatusResponseInterface> {
    const path = Path.join(this.basePath, filePath.path);

    try {
      if (this.isFolder(path))
        await FS.promises.rm(path, { force: true, recursive: true });
      else await FS.promises.rm(path);
    } catch (e) {
      this.logger.error(e);

      const eventId = Sentry.captureException(e, {
        tags: {
          path: filePath.path,
        },
      });

      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
      sentryEventId: '',
    };
  }

  @GrpcMethod()
  async getFileStats(
    filePath: FilePathInterface,
  ): Promise<FileDetailsInterface> {
    const path = this.getLocalFullPath(filePath.path);

    if (!(await this.doseFileExists(path))) {
      return {
        fileType: FileTypeEnum.FILE_TYPE_UNKNOWN,
        exists: false,
        name: '',
        size: Long.fromNumber(0),
        path: '',
        created: Long.fromNumber(0),
        changed: Long.fromNumber(0),
      };
    } else {
      const stats = await FS.promises.stat(path);

      return {
        name: Path.basename(path),
        exists: true,
        size: Long.fromNumber(stats.size),
        created: Long.fromNumber(stats.birthtimeMs),
        changed: Long.fromNumber(stats.ctimeMs),
        path: this.getLocalPath(path),
        fileType: stats.isFile()
          ? FileTypeEnum.FILE_TYPE_FILE
          : stats.isDirectory()
          ? FileTypeEnum.FILE_TYPE_FOLDER
          : FileTypeEnum.FILE_TYPE_UNKNOWN,
      };
    }
  }

  @GrpcMethod()
  async writeFile(
    chunk: FileChunkInterface,
  ): Promise<OperationStatusResponseInterface> {
    try {
      await FS.promises.writeFile(
        this.getLocalFullPath(chunk.path),
        chunk.content || '',
      );
    } catch (e) {
      this.logger.error(e);
      const eventId = Sentry.captureException(e, {
        tags: {
          path: chunk.path,
        },
      });
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
      sentryEventId: '',
    };
  }

  @GrpcMethod()
  getFile(filePath: GetFileInterface): Observable<FileChunkInterface> {
    const subject = new Subject<FileChunkInterface>();

    if (!this.doseFileExists(filePath.path)) {
      return new Observable<FileChunkInterface>((subscriber) =>
        subscriber.error('File does not exist '),
      );
    }

    FS.createReadStream(this.getLocalFullPath(filePath.path), {
      start: filePath.start,
    })
      .on('data', (data: Buffer) => {
        subject.next({
          path: filePath.path,
          content: data,
        });
      })
      .on('close', () => {
        subject.complete();
      });

    return subject.asObservable();
  }

  @GrpcMethod()
  getFolder(filePath: FilePathInterface): Observable<FileChunkInterface> {
    const subject = new Subject<FileChunkInterface>();

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    archive.on('data', (data) => {
      subject.next({
        path: filePath.path,
        content: data,
      });
    });
    archive.on('end', () => {
      subject.complete();
    });
    archive.on('warning', console.log);
    archive.on('error', console.log);

    archive.directory(this.getLocalFullPath(filePath.path), false);

    archive.finalize();

    return subject.asObservable();
  }

  @GrpcMethod()
  async getFiles(
    filePath: FilePathInterface,
  ): Promise<FileDetailsListInterface> {
    const fullPath = this.getLocalFullPath(filePath.path);

    const returnFiles: FileDetailsListInterface = { fileDetails: [] };

    const folder = await FS.promises.opendir(fullPath);

    for await (const file of folder) {
      const stats = await FS.promises.stat(Path.join(fullPath, file.name));
      if (file.isDirectory()) {
        returnFiles.fileDetails.push({
          exists: true,
          size: Long.fromNumber(0),
          name: file.name,
          fileType: FileTypeEnum.FILE_TYPE_FOLDER,
          path: this.getLocalPath(Path.join(fullPath, file.name)),
          created: Long.fromNumber(stats.birthtimeMs),
          changed: Long.fromNumber(stats.ctimeMs),
        });
      } else if (file.isFile()) {
        returnFiles.fileDetails.push({
          exists: true,
          name: file.name,
          fileType: FileTypeEnum.FILE_TYPE_FILE,
          path: this.getLocalPath(Path.join(fullPath, file.name)),
          size: Long.fromNumber(stats.size),
          created: Long.fromNumber(stats.birthtimeMs),
          changed: Long.fromNumber(stats.ctimeMs),
        });
      }
    }
    return returnFiles;
  }

  @GrpcStreamMethod()
  async uploadFile(
    messages: Observable<FileChunkInterface>,
  ): Promise<OperationStatusResponseInterface> {
    return new Promise((resolve) => {
      const tempPath = Path.join(
        '/temp',
        new Date().getTime() + crypto.randomBytes(5).toString('hex'),
      );

      const writeStream = FS.createWriteStream(tempPath);

      let path;

      const onNext = (message: FileChunkInterface): void => {
        path = message.path;
        writeStream.write(message.content);
      };
      const onComplete = async (): Promise<void> => {
        writeStream.close();
        if (path) {
          try {
            await FS.promises.rename(tempPath, path);
          } catch (e) {
            this.logger.error(e);
            const eventId = Sentry.captureException(e, {
              tags: {
                path: path,
              },
            });

            return resolve({
              operationStatus:
                OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
              sentryEventId: eventId,
            });
          }
        } else {
          return resolve({
            operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
          });
        }

        return resolve({
          operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
          sentryEventId: '',
        });
      };

      writeStream.once('open', () => {
        messages.subscribe({
          complete: onComplete,
          next: onNext,
        });
      });
    });
  }

  @GrpcMethod()
  async createFolder({
    path,
  }: FilePathInterface): Promise<OperationStatusResponseInterface> {
    try {
      await FS.promises.mkdir(this.getLocalFullPath(path));
    } catch (e) {
      this.logger.error(e);

      const eventId = Sentry.captureException(e, {
        tags: {
          path: path,
        },
      });
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }
    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
      sentryEventId: '',
    };
  }
  @GrpcMethod()
  async renameFile(
    paths: FilePathsInterface,
  ): Promise<OperationStatusResponseInterface> {
    try {
      await FS.promises.rename(
        this.getLocalFullPath(paths.firstPath),
        this.getLocalFullPath(paths.secondPath),
      );
    } catch (e) {
      this.logger.error(e);

      const eventId = Sentry.captureException(e, {
        tags: {
          fromPath: paths.firstPath,
          toPath: paths.secondPath,
        },
      });

      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }
    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  private async doseFileExists(path: string): Promise<boolean> {
    try {
      await FS.promises.access(path, FS.constants.F_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  private getLocalFullPath(path: string): string {
    return Path.join(this.basePath, path);
  }

  private getLocalPath(path: string): string {
    return path
      .substr(this.basePath.length + 1)
      .split('/')
      .slice(1)
      .join('/');
  }

  private isFolder(path: string): boolean {
    return FS.statSync(path).isDirectory();
  }

  @GrpcMethod()
  async completeChunkUpload(
    completeChunk: CompleteChunkInterface,
  ): Promise<OperationStatusResponseInterface> {
    const fullPath = Path.join('/temp', completeChunk.path);
    const files = FS.readdirSync(fullPath).sort((a, b) => +a - +b);

    await FS.promises.mkdir(
      Path.dirname(this.getLocalFullPath(completeChunk.destination)),
      {
        recursive: true,
      },
    );

    const stream = FS.createWriteStream(
      this.getLocalFullPath(completeChunk.destination),
    );

    for (const file of files) {
      stream.write(await FS.promises.readFile(Path.join(fullPath, file)));
    }

    try {
      await FS.promises.rm(Path.join('/temp', completeChunk.path), {
        recursive: true,
        force: true,
      });
    } catch (e) {
      this.logger.error(e);
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  @GrpcStreamMethod()
  uploadFileChunk(
    messages: Observable<FileChunkInterface>,
  ): Promise<OperationStatusResponseInterface> {
    return new Promise((resolve) => {
      const tempPath = Path.join(
        '/temp',
        new Date().getTime() + crypto.randomBytes(5).toString('hex'),
      );

      const writeStream = FS.createWriteStream(tempPath);

      let path;

      const onNext = (message: FileChunkInterface): void => {
        path = message.path;
        writeStream.write(message.content);
      };
      const onComplete = async (): Promise<void> => {
        writeStream.close();
        if (path) {
          const fullPath = Path.join('/temp', path);

          try {
            await FS.promises.mkdir(Path.dirname(fullPath), {
              recursive: true,
            });
            await FS.promises.rename(tempPath, fullPath);
          } catch (e) {
            this.logger.error(e);
            const eventId = Sentry.captureException(e, {
              tags: {
                path: path,
              },
            });

            return resolve({
              operationStatus:
                OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
              sentryEventId: eventId,
            });
          }
        } else {
          return resolve({
            operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
          });
        }

        return resolve({
          operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
          sentryEventId: '',
        });
      };

      messages.subscribe({
        complete: onComplete,
        next: onNext,
      });
    });
  }

  @GrpcMethod()
  async loadServerFromS3({
    id,
  }: ServerIdInterface): Promise<OperationStatusResponseInterface> {
    const test = await this.s3Client.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: 'server-archive/' + id,
    });

    const tempFile =
      '/temp/server' + id + crypto.randomBytes(5).toString('hex');

    try {
      await new Promise<void>((resolve, reject) => {
        test
          .createReadStream()
          .pipe(FS.createWriteStream(tempFile))
          .on('error', reject)
          .on('close', async () => {
            const zip = new StreamZipAsync({
              file: tempFile,
              // Not dangerous if we do not extract  the file
            });

            const serverLocation = this.getLocalFullPath(id.toString());
            await FS.promises.mkdir(serverLocation, { recursive: true });

            await zip.extract(null, serverLocation);
            resolve();
          });
      });
    } catch (e) {
      const eventId = Sentry.captureException(e);
      this.logger.error(e);
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  @GrpcMethod()
  async moveServerToS3({
    id,
  }: ServerIdInterface): Promise<OperationStatusResponseInterface> {
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    try {
      await new Promise<void>((resolve, reject) => {
        this.s3Client.upload(
          {
            Body: archive,
            Bucket: process.env.S3_BUCKET,
            Key: 'server-archive/' + id,
          },
          (err) => {
            if (err) {
              reject(err);
            }
            resolve();
          },
        );
        archive.directory(this.getLocalFullPath(id.toString()), false);
        archive.finalize();
      });
    } catch (e) {
      const eventId = Sentry.captureException(e);
      this.logger.error(e);
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  @GrpcMethod()
  async deleteTempFolder(
    path: FilePathInterface,
  ): Promise<OperationStatusResponseInterface> {
    try {
      await FS.promises.rmdir(Path.join('/temp', path.path));
    } catch (e) {
      this.logger.error(e);
      const sentryId = Sentry.captureException(e, {
        tags: {
          path: path.path,
        },
      });

      return {
        sentryEventId: sentryId,
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
      };
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }
}
