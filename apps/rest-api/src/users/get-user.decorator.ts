import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from './user.entity';
import { Socket } from 'socket.io';

export const GetUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    return userExtractor(context);
  },
);

export function userExtractor(context: ExecutionContext): User {
  switch (context.getType()) {
    case 'http':
      return context.switchToHttp().getRequest<Request>().user;
    case 'ws':
      return context.switchToWs().getClient<Socket>().data.user;
  }
}
