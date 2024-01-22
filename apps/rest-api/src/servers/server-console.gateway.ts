import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserserverApiAuthGuard } from '@mypvp/userserver-api-auth';
import { LoadUserInterceptor } from '../users/load-user.interceptor';
import { HasContext } from '../common/has-context.decorator';
import { Socket } from 'socket.io';
import { ConnectToConsoleDto } from './dto/connect-to-console.dto';
import { Server } from './server.entity';
import { ServerIdOrAliasExtractor } from './server-id-or-alias-extractor.decorator';
import { HasServerPermission } from '../server-permissions/has-server-permission.decorator';
import { ServerPermissions } from '../server-permissions/server-permissions.enum';
import { GetServer } from './get-server.decorator';
import { AddObservables } from '@userserver-api/type-utils';
import {
  ConsoleDataInterface,
  ContainersServiceInterface,
  RpcServiceManager,
  ServiceType,
} from '@userserver-api/services';
import { getErrorHandlingProxy } from '../common/error-handling-proxy';
import { Subject } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { LoadServerInterceptor } from './server.interceptor';
import { NodesService } from '../nodes/nodes.service';

@WebSocketGateway({
  path: process.env.API_GLOBAL_PREFIX + '/socket',
  namespace: '/console',
  cors: {
    origin: '*',
    preflightContinue: false,
    credentials: true,
    methods: ['POST', 'PUT', 'GET', 'DELETE', 'PATCH'],
  },
})
@Injectable()
@UseGuards(UserserverApiAuthGuard())
@UseInterceptors(LoadUserInterceptor, LoadServerInterceptor)
export class ServerConsoleGateway {
  private logger = new Logger(ServerConsoleGateway.name);

  constructor(
    private readonly rpcServiceManager: RpcServiceManager,
    private readonly nodesService: NodesService,
  ) {}

  @HasContext()
  @SubscribeMessage('connectConsole')
  @ServerIdOrAliasExtractor(
    (context) =>
      context.switchToWs().getData<ConnectToConsoleDto>().serverIdOrAlias,
  )
  @HasServerPermission(ServerPermissions.TERMINAL)
  async connectToConsole(
    @ConnectedSocket() socket: Socket,
    @GetServer() server: Server,
    @MessageBody() connectToConsoleDto: ConnectToConsoleDto,
  ): Promise<void> {
    if (server.status !== 'ONLINE' && server.status !== 'STARTING')
      throw new WsException('Server is not Online');

    const subject = new Subject<ConsoleDataInterface>();
    const metadata = new Metadata();
    metadata.set('server-id', server.id.toString());
    metadata.set('terminal-height', connectToConsoleDto.height.toString());
    metadata.set('terminal-width', connectToConsoleDto.width.toString());

    const response = (
      await this.getContainersServiceForServer({
        id: server.id,
      })
    ).attachToContainer(subject.asObservable(), metadata);

    response.subscribe({
      next: (data) => {
        if (data.message) {
          socket.emit('consoleOutput', [...data.message]);
        }
      },
      error: (e) => {
        console.error(e);
        socket.disconnect();
      },
      complete: () => socket.disconnect(),
    });

    socket.on('consoleInput', (data) => {
      subject.next({
        message: Buffer.from(data),
      });
    });
  }

  async getContainersServiceForServer({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
  }: Pick<Server, 'id'>): Promise<AddObservables<ContainersServiceInterface>> {
    const node = await this.nodesService.getRunnerNodeForServer(id);

    const service = this.rpcServiceManager.getServiceForNode<
      AddObservables<ContainersServiceInterface>
    >(ServiceType.CONTAINERS, node);

    if (!service) return service;

    return getErrorHandlingProxy(service);
  }
}
