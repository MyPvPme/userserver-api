import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Server } from '../servers/server.entity';
import { RunnerNodeStorageNode } from './runner-node-storage-node.entity';
import {
  NodeStatsInterface,
  RpcServiceManager,
  ServiceType,
} from '@userserver-api/services';
import { ContainersServiceInterface } from '@userserver-api/services';
import { AddObservables } from '@userserver-api/type-utils';
import { firstValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';

@Injectable()
export class NodesService {
  private static readonly logger = new Logger(NodesService.name);

  private readonly storageNodeCache = new Map<number, string>();
  private readonly runnerNodeCache = new Map<number, string>();

  constructor(private readonly rpcService: RpcServiceManager) {}

  async getStorageNodeForServer(serverId: number): Promise<string> {
    if (this.storageNodeCache.has(serverId)) {
      return this.storageNodeCache.get(serverId);
    } else {
      const server = await Server.findOneBy({
        id: serverId,
      });

      this.storageNodeCache.set(serverId, server.storageNodeId);
      return server.storageNodeId;
    }
  }

  async getRunnerNodeForServer(
    serverId: number,
    forceNew = false,
  ): Promise<string> {
    if (this.runnerNodeCache.has(serverId)) {
      return this.runnerNodeCache.get(serverId);
    } else {
      const server = await Server.findOneBy({
        id: serverId,
      });

      if (!server.runnerNodeId || forceNew) {
        const availableRunnerNodes = await RunnerNodeStorageNode.findBy({
          storageNodeId: server.storageNodeId,
        });

        if (availableRunnerNodes.length === 0)
          throw new InternalServerErrorException('No node is available');

        const nodeStats: { nodeId: string; stats: NodeStatsInterface }[] = [];

        for (const availableRunnerNode of availableRunnerNodes) {
          const service = this.rpcService.getServiceForNode<
            AddObservables<ContainersServiceInterface>
          >(ServiceType.CONTAINERS, availableRunnerNode.runnerNodeId);

          try {
            nodeStats.push({
              nodeId: availableRunnerNode.runnerNodeId,
              stats: await firstValueFrom(service.getNodeStats({})),
            });
          } catch (e) {
            Sentry.captureException(e);
            NodesService.logger.error(e);
          }
        }

        if (nodeStats.length === 0)
          throw new InternalServerErrorException('No node is available');

        const topNode = nodeStats.sort(
          (a, b) => a.stats.freeRam.toNumber() - b.stats.freeRam.toNumber(),
        )[0];

        server.runnerNodeId = topNode.nodeId;
        await server.save();
      }

      this.runnerNodeCache.set(serverId, server.runnerNodeId);

      return server.runnerNodeId;
    }
  }
}
