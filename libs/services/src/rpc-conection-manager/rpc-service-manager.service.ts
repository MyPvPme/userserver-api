import { ClientGrpcProxy } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { NoConnectionFoundException } from '@userserver-api/services/rpc-conection-manager/no-connection-found.exception';
import { join } from 'path';

@Injectable()
export class RpcServiceManager {
  private readonly storageNodes = new Map<string, ClientGrpcProxy>();
  private readonly runnerNodes = new Map<string, ClientGrpcProxy>();

  getServiceForNode<T>(serviceName: ServiceType, id: string): T {
    const connection = this.getConnectionForService(serviceName, id);
    return connection.getService<T>(serviceName);
  }

  getStorageNodConnection(nodeId: string): ClientGrpcProxy {
    if (this.storageNodes.has(nodeId)) {
      return this.storageNodes.get(nodeId);
    } else {
      const connection = new ClientGrpcProxy({
        url: `storage-node-${nodeId.toLowerCase()}:5000`,
        package: ['files', 'extensions'],
        protoPath: [
          join(process.cwd(), 'proto/files/files.proto'),
          join(process.cwd(), 'proto/extensions/extensions.proto'),
        ],
      });

      this.storageNodes.set(nodeId, connection);

      return connection;
    }
  }

  getRunnerNodeConnection(nodeId: string): ClientGrpcProxy {
    if (this.runnerNodes.has(nodeId)) {
      return this.runnerNodes.get(nodeId);
    } else {
      const connection = new ClientGrpcProxy({
        url: `runner-node-${nodeId.toLowerCase()}:5000`,
        package: ['containers'],
        protoPath: [join(process.cwd(), 'proto/containers/containers.proto')],
      });

      this.runnerNodes.set(nodeId, connection);

      return connection;
    }
  }

  private getConnectionForService(
    service: ServiceType,
    nodeId: string,
  ): ClientGrpcProxy {
    switch (service) {
      case ServiceType.FILES:
      case ServiceType.EXTENSIONS:
        return this.getStorageNodConnection(nodeId);
      case ServiceType.CONTAINERS:
        return this.getRunnerNodeConnection(nodeId);
    }

    throw new NoConnectionFoundException(
      'No connection was found for the service',
    );
  }
}

export enum ServiceType {
  FILES = 'FilesService',
  CONTAINERS = 'ContainersService',
  EXTENSIONS = 'ExtensionsService',
}
