import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from './users.service';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserDoesNotHaveThePermissionException } from './exceptions/user-does-not-have-the-permission.exception';
import { Socket } from 'socket.io';
import { isUUID } from 'class-validator';

@Injectable()
export class LoadUserInterceptor implements NestInterceptor {
  constructor(
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Observable<any>> {
    const noUserContext = this.reflector.get<boolean>(
      'no-user-context',
      context.getHandler(),
    );

    if (!noUserContext) {
      let uuid: string;

      switch (context.getType()) {
        case 'http':
          uuid = context.switchToHttp().getRequest<Request>().context;
          break;
        case 'ws':
          uuid = context.switchToWs().getClient<Socket>().data.context;
      }

      const optionalUserContext = this.reflector.get<boolean>(
        'optional-user-context',
        context.getHandler(),
      );

      if (!uuid && optionalUserContext) {
        return next.handle();
      }

      if (!uuid) {
        throw new InternalServerErrorException('UUID not found');
      }

      if (!isUUID(uuid)) {
        throw new BadRequestException('Context is not an UUID');
      }

      const user = await this.usersService.getOrCreateUserByUuid(uuid);

      const permission = this.reflector.getAllAndOverride('permission', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (permission) {
        if (!user.hasPermission(permission)) {
          throw new UserDoesNotHaveThePermissionException(
            `User ${user.uuid} do not have the permission ${permission}`,
          );
        }
      }

      switch (context.getType()) {
        case 'http':
          context.switchToHttp().getRequest<Request>().user = user;
          break;
        case 'ws':
          context.switchToWs().getClient<Socket>().data.user = user;
      }
    }

    return next.handle();
  }
}
