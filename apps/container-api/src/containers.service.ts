import { Controller, Logger } from '@nestjs/common';
import {
  ConsoleDataInterface,
  ContainersListInterface,
  ContainersServiceInterface,
  ContainerStatusEnum,
  ExecCommandToContainerInterface,
  NodeStatsInterface,
  OperationStatusEnum,
  OperationStatusResponseInterface,
  StartContainerInterface,
  StartContainerResponseInterface,
  StatusResponseInterface,
  StopContainerInterface,
} from '@userserver-api/services';
import { Observable, Subject } from 'rxjs';
import * as Docker from 'dockerode';
import { AddOptionalPromise } from '@userserver-api/type-utils';
import * as Path from 'path';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import * as Sentry from '@sentry/node';
import { ContainerStats } from 'dockerode';
import * as Long from 'long';
import { Metadata } from '@grpc/grpc-js';
import * as process from 'process';
import * as os from 'os';
import { ServerIsFullException } from './exceptions/server-is-full.exception';

@Controller()
export class ContainersService
  implements AddOptionalPromise<ContainersServiceInterface>
{
  private readonly logger = new Logger(ContainersService.name);
  private readonly serverPathOnHost = process.env.USERSERVER_HOST_PATH;
  private statusSubscriber: Subject<StatusResponseInterface>[] = [];
  private connectedContainerStats: string[] = [];

  private readonly ramBuffer: number;
  private readonly storageNodePathMapping: { [key: string]: string };

  constructor(private readonly docker: Docker) {
    this.connectEvent();

    if (process.env.RAM_BUFFER) {
      this.ramBuffer = +process.env.RAM_BUFFER;
    } else {
      this.ramBuffer = os.totalmem() * 0.1;
    }

    this.storageNodePathMapping = JSON.parse(process.env.STORAGE_MAPPING);
  }

  connectEvent(): void {
    this.docker.getEvents((error, result) => {
      if (error) {
        this.logger.error(error);
      }

      result.on('data', (chunk) => {
        try {
          this.handleDockerEvent(JSON.parse(chunk.toString('utf8')));
        } catch (e) {
          this.logger.error(`JSON message: ${chunk}`, e);
        }
      });

      result.on('end', () => {
        this.connectEvent();
      });
    });
  }

  private getPathFromStorageNode(nodeId: string): string {
    console.log(this.storageNodePathMapping);
    console.log(nodeId);
    return this.storageNodePathMapping[nodeId];
  }

  connectContainerStats(
    containerId: string,
    serverId: number,
    reconnect = false,
  ): void {
    if (!reconnect) this.connectedContainerStats.push(containerId);
    this.docker
      .getContainer(containerId)
      .stats((error, result: NodeJS.ReadableStream) => {
        if (error) {
          if (this.connectedContainerStats.includes(containerId))
            this.logger.error(error);
          return;
        }

        result.on('data', (chunk) => {
          try {
            const stats: ContainerStats = JSON.parse(chunk);

            this.sendStatus({
              serverId,
              stats: {
                cpu: stats.cpu_stats.cpu_usage.total_usage,
                ram: Long.fromNumber(stats.memory_stats.usage),
              },
            });
          } catch (e) {}
        });

        result.on('end', () => {
          this.connectContainerStats(containerId, serverId, true);
        });
      });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleDockerEvent(event: any): void {
    if (event.Type === 'container') {
      if (event?.Actor?.Attributes['me.mypvp.userserver.id']) {
        const serverId = +event?.Actor?.Attributes['me.mypvp.userserver.id'];
        switch (event.Action) {
          case 'start':
            this.sendStatus({
              serverId,
              statusChange: {
                status: ContainerStatusEnum.CONTAINER_STATUS_STARTED,
              },
            });
            this.connectContainerStats(event.Actor.ID, serverId);
            break;
          case 'destroy':
            this.sendStatus({
              serverId,
              statusChange: {
                status: ContainerStatusEnum.CONTAINER_STATUS_STOPPED,
              },
            });
            break;
        }
      }
    }
  }

  sendStatus(status: StatusResponseInterface): void {
    this.statusSubscriber.forEach((subscriber) => subscriber.next(status));
  }

  @GrpcMethod()
  async execCommandToContainer(
    execCommandToContainer: ExecCommandToContainerInterface,
  ): Promise<OperationStatusResponseInterface> {
    let containers: Docker.ContainerInfo[];

    try {
      containers = await this.docker.listContainers({
        limit: 1,
        filters: {
          label: [`me.mypvp.userserver.id=${execCommandToContainer.serverId}`],
        },
      });
    } catch (e) {
      this.logger.error(e);

      const eventId = Sentry.captureException(e, {
        tags: {
          userserverId: execCommandToContainer.serverId,
        },
      });

      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }

    if (!containers || containers.length != 1) {
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
      };
    }

    try {
      const stream = await this.docker
        .getContainer(containers[0].Id)
        .attach({ stream: true, stdin: true, stdout: true });

      await new Promise<void>((resolve, reject) => {
        stream.write(Buffer.from(execCommandToContainer.command), () =>
          resolve(),
        );
        stream.on('error', (e) => reject(e));
      });

      stream.end();
    } catch (e) {
      this.logger.error(e);

      const eventId = Sentry.captureException(e, {
        tags: {
          userserverId: execCommandToContainer.serverId,
        },
      });

      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }

    return { operationStatus: OperationStatusEnum.OPERATION_STATUS_OK };
  }

  @GrpcMethod()
  getStatus(): Observable<StatusResponseInterface> {
    const subject = new Subject<StatusResponseInterface>();
    this.statusSubscriber.push(subject);
    setTimeout(() => {
      subject.next({
        serverId: 0,
      });
    }, 20);

    return subject.asObservable();
  }

  @GrpcMethod()
  async getRunningContainers(): Promise<ContainersListInterface> {
    try {
      const containers = await this.docker.listContainers();
      return {
        containers: containers
          .filter((container) => container.Labels['me.mypvp.userserver.id'])
          .map((container) => +container.Labels['me.mypvp.userserver.id']),
      };
    } catch (e) {
      return { containers: [] };
    }
  }

  @GrpcMethod()
  getNodeStats(): NodeStatsInterface {
    return {
      cpuUsage: Long.fromNumber(0),
      totalRam: Long.fromNumber(os.totalmem()),
      freeRam: Long.fromNumber(os.freemem()),
    };
  }

  @GrpcMethod()
  async startContainer(
    startContainer: StartContainerInterface,
  ): Promise<StartContainerResponseInterface> {
    if (os.freemem() < startContainer.ram.toNumber() + this.ramBuffer) {
      throw new ServerIsFullException();
    }

    this.sendStatus({
      serverId: startContainer.serverId,
      statusChange: {
        status: ContainerStatusEnum.CONTAINER_STATUS_STARTING,
      },
    });

    await new Promise<void>((resolve, reject) => {
      this.docker.pull(
        startContainer.image,
        {
          authconfig: {
            username: process.env.DOCKER_REPO_USERNAME,
            password: process.env.DOCKER_REPO_PASSWORD,
          },
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          this.docker.modem.followProgress(result, (error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        },
      );
    });

    this.docker
      .createContainer({
        name: `${process.env.CONTAINER_PREFIX || ''}userserver-server-${
          startContainer.serverId
        }`,
        Cmd: startContainer.startCommand.split(' '),
        Tty: true,
        OpenStdin: true,
        Image: startContainer.image,
        WorkingDir: '/home/server',
        Env: [
          ...Object.keys(startContainer.env).map(
            (key) => `${key}=${startContainer.env[key]}`,
          ),
          `DISALLOWED_HOSTNAME_PREFIX=${
            process.env.CONTAINER_PREFIX || ''
          }userserver-server`,
        ],
        HostConfig: {
          Memory:
            process.env.USERSERVER_IGNORE_RAM_LIMIT === 'true'
              ? undefined
              : startContainer.ram.toNumber(),
          NetworkMode: process.env.USERSERVER_NETWORK,
          AutoRemove: true,
          Mounts: [
            {
              Type: 'bind',
              Source: Path.join(
                this.getPathFromStorageNode(startContainer.storageNode),
                startContainer.serverId.toString(),
              ),
              Target: '/home/server',
            },
          ],
        },
        Labels: {
          'me.mypvp.userserver.id': startContainer.serverId.toString(),
        },
      })
      .catch((e) => {
        this.logger.error(e);
        Sentry.captureException(e, {
          tags: {
            userserverId: startContainer.serverId,
          },
        });

        this.sendStatus({
          serverId: startContainer.serverId,
          statusChange: {
            status: ContainerStatusEnum.CONTAINER_STATUS_COULD_NOT_START,
          },
        });
      })
      .then((container) => {
        if (container) {
          container.start();
        }
      });

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  @GrpcMethod()
  async stopContainer(
    stopContainer: StopContainerInterface,
  ): Promise<OperationStatusResponseInterface> {
    this.logger.debug(`Stopping container ${stopContainer.serverId}`);
    let containers: Docker.ContainerInfo[];

    try {
      containers = await this.docker.listContainers({
        limit: 1,
        filters: {
          label: [`me.mypvp.userserver.id=${stopContainer.serverId}`],
        },
      });
    } catch (e) {
      this.logger.error(e);

      const eventId = Sentry.captureException(e, {
        tags: {
          userserverId: stopContainer.serverId,
        },
      });

      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
        sentryEventId: eventId,
      };
    }

    if (!containers || containers.length != 1) {
      return {
        operationStatus: OperationStatusEnum.OPERATION_STATUS_SYSTEM_ERROR,
      };
    }

    this.sendStatus({
      serverId: stopContainer.serverId,
      statusChange: {
        status: ContainerStatusEnum.CONTAINER_STATUS_STOPPING,
      },
    });

    this.docker.getContainer(containers[0].Id).stop((error) => {
      if (error) {
        Sentry.captureException(error, {
          tags: {
            userserverId: stopContainer.serverId,
            containerId: containers[0]?.Id,
          },
        });

        this.sendStatus({
          serverId: stopContainer.serverId,
          statusChange: {
            status: ContainerStatusEnum.CONTAINER_STATUS_COULD_NOT_STOP,
          },
        });
        return;
      }
    });

    return {
      operationStatus: OperationStatusEnum.OPERATION_STATUS_OK,
    };
  }

  @GrpcStreamMethod()
  attachToContainer(
    data: Observable<ConsoleDataInterface>,
    metadata: Metadata,
  ): Observable<ConsoleDataInterface> {
    const serverId = metadata.get('server-id')[0];
    const height = metadata.get('terminal-height')[0];
    const width = metadata.get('terminal-width')[0];

    const subject = new Subject<ConsoleDataInterface>();

    const call = async (): Promise<void> => {
      const containers = await this.docker.listContainers({
        limit: 1,
        filters: {
          label: [`me.mypvp.userserver.id=${serverId}`],
        },
      });

      const container = await this.docker.getContainer(containers[0].Id);

      await container.resize({ w: width, h: height });

      const logs = (await container.logs({
        stdout: true,
        tail: 100,
      })) as unknown as Buffer;

      const stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
      });

      subject.next({
        message: logs,
      });

      stream
        .on('data', (data: Buffer) => {
          subject.next({
            message: data,
          });
        })
        .on('error', () => subject.complete())
        .on('close', () => subject.complete());

      data.subscribe({
        next: (data) => {
          stream.write(data.message);
        },
        error: () => stream.end(),
        complete: () => stream.end(),
      });
    };

    call().catch((err) => {
      subject.error(err);
    });

    return subject.asObservable();
  }
}
