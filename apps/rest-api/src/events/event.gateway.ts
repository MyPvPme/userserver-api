import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GetUser } from '../users/get-user.decorator';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from './event.entity';
import { getRequiredPermissionForEvent } from './event-type.enum';
import { HasContext } from '../common/has-context.decorator';
import { Injectable, UseGuards, UseInterceptors } from '@nestjs/common';
import { LoadUserInterceptor } from '../users/load-user.interceptor';
import {
  AllowedTokens,
  NoUserContext,
  UserserverApiAuthGuard,
  UserserverApiSystemToken,
} from '@mypvp/userserver-api-auth';

@WebSocketGateway({
  path: process.env.API_GLOBAL_PREFIX + '/socket',
  namespace: '/events',
  cors: {
    origin: '*',
    preflightContinue: false,
    credentials: true,
    methods: ['POST', 'PUT', 'GET', 'DELETE', 'PATCH'],
  },
})
@Injectable()
@UseGuards(UserserverApiAuthGuard())
@UseInterceptors(LoadUserInterceptor)
export class EventGateway {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly usersService: UsersService) {}

  serverToSocket = new Map<string, Socket[]>();

  @NoUserContext()
  @SubscribeMessage('subscribe_system')
  @AllowedTokens(UserserverApiSystemToken)
  handleSystemSubscribe(@ConnectedSocket() client: Socket): void {
    client.join('all_events');
  }

  @HasContext()
  @SubscribeMessage('subscribe')
  async handelSubscribe(
    @ConnectedSocket() client: Socket,
    @GetUser() user?: User,
  ): Promise<void> {
    client.join('users');

    if (!this.serverToSocket.has(user.uuid))
      this.serverToSocket.set(user.uuid, []);

    this.serverToSocket.get(user.uuid).push(client);

    client.on('disconnect', () => {
      const sockets = this.serverToSocket.get(user.uuid);

      if (sockets) {
        const index = sockets.findIndex((socket) => socket.id === client.id);
        if (index > -1) sockets.splice(index, 1);
      }
    });
  }

  @OnEvent('**')
  handelEvent(event: Event): void {
    const receivers = [...new Set(event.receivers)];

    this.server.to('all_events').emit('event', { ...event, receivers });

    const permission = getRequiredPermissionForEvent(event.type);
    if (!permission && !event.receivers) {
      this.server.to('users').emit('event', { ...event, receivers: undefined });
      return;
    } else {
      receivers.forEach((receiver) => {
        if (this.serverToSocket.has(receiver)) {
          this.serverToSocket.get(receiver).forEach((socket) => {
            socket.emit('event', { ...event, receivers: undefined });
          });
        }
      });
    }
  }
}
