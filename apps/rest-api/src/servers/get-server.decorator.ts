import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Server } from './server.entity';
import { Socket } from 'socket.io';

export const GetServer = createParamDecorator(
  (data, context: ExecutionContext) => {
    return serverExtractor(context);
  },
);

export function serverExtractor(context: ExecutionContext): Server {
  switch (context.getType()) {
    case 'http':
      return context.switchToHttp().getRequest<Request>().server;
    case 'ws':
      return context.switchToWs().getClient<Socket>().data.server;
  }
}
