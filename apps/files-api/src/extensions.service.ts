import { Controller, Inject } from '@nestjs/common';
import { AddOptionalPromise } from '@userserver-api/type-utils';
import {
  ExtensionsServiceInterface,
  ExtensionVersionActionInterface,
  OperationStatusEnum,
  OperationStatusResponseInterface,
  PluginInterface,
  PluginsInterface,
  ServerIdInterface,
} from '@userserver-api/services';
import { GrpcMethod } from '@nestjs/microservices';
import * as Path from 'path';
import * as FS from 'fs';
import { async as StreamZipAsync } from 'node-stream-zip';
import * as CRC32 from 'crc-32';
import * as Long from 'long';
import * as AWS from 'aws-sdk';

@Controller()
export class ExtensionsService
  implements AddOptionalPromise<ExtensionsServiceInterface>
{
  basePath = '/home/servers';
  bucketPrefix = 'extensions';

  constructor(@Inject('S3') private readonly s3Client: AWS.S3) {}

  @GrpcMethod()
  async getAllSpigotPlugins({
    id,
  }: ServerIdInterface): Promise<PluginsInterface> {
    const plugins: PluginsInterface = { plugins: [] };
    const pluginsFolder = this.getLocalFullPath(id.toString(), 'plugins');

    if (!FS.existsSync(pluginsFolder)) {
      return plugins;
    }

    const folderStats = await FS.promises.stat(pluginsFolder);

    if (!folderStats.isDirectory()) {
      return plugins;
    }

    const dir = await FS.promises.opendir(pluginsFolder);

    for await (const file of dir) {
      if (file.isFile() && file.name.endsWith('.jar')) {
        plugins.plugins.push(
          await this.getPluginFromPath(Path.join(pluginsFolder, file.name)),
        );
      }
    }

    plugins.plugins = plugins.plugins.filter((plugin) => plugin);

    return plugins;
  }

  @GrpcMethod()
  async installExtensionVersion(
    extensionVersion: ExtensionVersionActionInterface,
  ): Promise<OperationStatusResponseInterface> {
    try {
      await Promise.all(
        extensionVersion.extensionVersion.files.map<Promise<void>>(
          async (versionFile) => {
            const stream = this.s3Client.getObject({
              Bucket: process.env.S3_BUCKET,
              Key:
                this.bucketPrefix +
                '/' +
                extensionVersion.extensionVersion.id +
                '/' +
                versionFile.filename,
            });

            await FS.promises.mkdir(
              this.getLocalFullPath(
                extensionVersion.serverId.id.toString(),
                versionFile.destination,
              ),
              { recursive: true },
            );

            const writeStream = FS.createWriteStream(
              this.getLocalFullPath(
                extensionVersion.serverId.id.toString(),
                versionFile.destination,
                versionFile.filename,
              ),
            );

            stream.on('httpData', (chuck) => {
              writeStream.write(chuck);
            });

            stream.send();

            await new Promise<void>((resolve, reject) => {
              stream.on('httpDone', () => {
                resolve();
              });
              stream.on('error', (e) => reject(e));
              stream.on('httpError', (e) => reject(e));
            });

            writeStream.close();
          },
        ),
      );
    } catch (e) {
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: '',
      };
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  @GrpcMethod()
  uninstallExtensionVersion(
    extensionVersionAction: ExtensionVersionActionInterface,
  ): OperationStatusResponseInterface {
    try {
      extensionVersionAction.extensionVersion.files.map((file) =>
        FS.promises.rm(
          this.getLocalFullPath(
            extensionVersionAction.serverId.id.toString(),
            file.destination,
            file.filename,
          ),
          { force: true },
        ),
      );
    } catch (e) {
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: '',
      };
    }

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  private getLocalFullPath(...path: string[]): string {
    return Path.join(this.basePath, ...path);
  }

  private async getPluginFromPath(
    path: string,
  ): Promise<PluginInterface | undefined> {
    const plugin: PluginInterface = {
      pluginYml: '',
      comment: '',
      crc: Long.fromNumber(0, true),
      fileName: '',
    };

    plugin.fileName = Path.basename(path);

    const zip = new StreamZipAsync({
      file: path,
      // Not dangerous if we do not extract  the file
      skipEntryNameValidation: true,
    });

    let pluginEntire;

    try {
      pluginEntire = await zip.entry('plugin.yml');
    } catch (e) {
      return undefined;
    }

    if (pluginEntire && pluginEntire.isFile) {
      let pluginYml;

      try {
        pluginYml = await zip.entryData('plugin.yml');
      } catch (e) {
        return undefined;
      }

      try {
        plugin.pluginYml = pluginYml.toString();
      } catch (e) {
        return undefined;
      }
    } else {
      return undefined;
    }

    try {
      plugin.comment = (await zip.comment) || '';
    } catch (e) {}

    if (typeof plugin.comment === 'string' && plugin.comment !== '') {
      plugin.crc = Long.fromNumber(await this.getCRC32CheckSumFromFile(path));
    }

    await zip.close();

    return plugin;
  }

  async getCRC32CheckSumFromFile(path: string): Promise<number> {
    return CRC32.buf(await FS.promises.readFile(path)) >>> 0;
  }
}
