import { ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { ServerIdCouldNotBeExtractedException } from './exceptions/server-id-could-not-be-extracted.exception';
import { ServersService } from './servers.service';
import { Server } from './server.entity';
import { Reflector } from '@nestjs/core';
import { userExtractor } from '../users/get-user.decorator';
import { UserMissingServerPermissionException } from './exceptions/user-missing-server-permission.exception';
import { ServerPermissions } from '../server-permissions/server-permissions.enum';
import { CallHandler } from '@nestjs/common/interfaces/features/nest-interceptor.interface';
import { Socket } from 'socket.io';
import { ServerStatus } from './server-status.enum';
import { ServerIsNotInRightStateException } from './exceptions/server-is-not-in-right-state.exception';
import { ServerIdOrAliasExtractor } from './server-id-or-alias-extractor.decorator';
import { isNumber } from '@nestjs/common/utils/shared.utils';
import { ServerNotFoundException } from './exceptions/server-not-found.exception';
import { User } from '../users/user.entity';

@Injectable()
export class LoadServerInterceptor implements NestInterceptor {
  constructor(
    private readonly serversService: ServersService,
    private readonly reflector: Reflector,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const serverIdOrAlias = this.getServerIdOrAlias(context);

    if (!serverIdOrAlias) {
      throw new ServerIdCouldNotBeExtractedException(
        'Server id/alias does not exist',
      );
    }

    let server: Server;

    if (isNumber(+serverIdOrAlias) && +serverIdOrAlias > 0) {
      server = await this.serversService.getServerById(+serverIdOrAlias, 6000);
    } else if (typeof serverIdOrAlias === 'string') {
      if (!serverIdOrAlias.match(/^[A-Za-zäöüÄÖÜß0-9]+$/)) {
        throw new ServerIdCouldNotBeExtractedException('Alias is invalid');
      }

      server = await this.serversService.getServerByAlias(
        serverIdOrAlias,
        6000,
      );
    }

    if (!server) {
      throw new ServerNotFoundException(
        `Server with alias ${serverIdOrAlias} not found`,
      );
    }

    this.setServer(server, context);

    const overwriteAllowedStatus = this.reflector.getAllAndOverride<
      ServerStatus[]
    >('allowed-server-status', [context.getHandler(), context.getClass()]);

    if (overwriteAllowedStatus) {
      if (!overwriteAllowedStatus.includes(server.status)) {
        throw new ServerIsNotInRightStateException(
          'Server is not in right state allowed: ' +
            overwriteAllowedStatus.join(','),
        );
      }
    } else {
      if (server.isArchived())
        throw new ServerIsNotInRightStateException('Server is archived');
    }

    if (
      this.reflector.getAllAndOverride<boolean>('no-server-permission', [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return next.handle();
    }

    const permission: ServerPermissions =
      this.reflector.getAllAndOverride<ServerPermissions>('server-permission', [
        context.getHandler(),
        context.getClass(),
      ]) || ServerPermissions.VIEW;

    const user = userExtractor(context);

    if (
      this.reflector.getAllAndOverride<boolean>('optional-user-context', [
        context.getHandler(),
        context.getClass(),
      ]) &&
      !user
    ) {
      return next.handle();
    }

    if (user.uuid === server.ownerUuid) {
      return next.handle();
    }

    if (
      permission === ServerPermissions.VIEW &&
      server.permissions.filter(
        (serverPermission) =>
          serverPermission.permission !== permission &&
          serverPermission.userUuid === user.uuid,
      ).length > 0
    ) {
      return next.handle();
    }

    if (
      server.permissions.find(
        (serverPermission) =>
          serverPermission.permission === permission &&
          serverPermission.userUuid === user.uuid,
      )
    ) {
      return next.handle();
    }

    const permissionOverwrite = this.reflector.getAllAndOverride<
      (server: Server, user: User, request: any) => boolean // eslint-disable-line @typescript-eslint/no-explicit-any
    >('server-permission-overwrite', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (
      permissionOverwrite &&
      permissionOverwrite(server, user, this.getPayload(context))
    ) {
      return next.handle();
    }

    throw new UserMissingServerPermissionException(
      `User do not have the ${permission} permission`,
    );
  }

  private setServer(server: Server, context: ExecutionContext): void {
    switch (context.getType()) {
      case 'http': {
        const request = context.switchToHttp().getRequest<Request>();
        request.server = server;
        break;
      }

      case 'ws': {
        context.switchToWs().getClient<Socket>().data.server = server;
        break;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getPayload(context: ExecutionContext): any {
    switch (context.getType()) {
      case 'http':
        return context.switchToHttp().getRequest<Request>().body;
    }
  }

  private getServerIdOrAlias(context: ExecutionContext): string {
    const extractor = this.reflector.getAllAndOverride<
      Parameters<typeof ServerIdOrAliasExtractor>[0]
    >('server-id-extractor', [context.getHandler(), context.getClass()]);

    if (extractor) {
      let argumentHost;

      switch (context.getType()) {
        case 'http': {
          argumentHost = context.switchToHttp();
          break;
        }
        case 'ws': {
          argumentHost = context.switchToWs();
          break;
        }
      }

      return extractor(argumentHost);
    } else {
      switch (context.getType()) {
        case 'http': {
          const request = context
            .switchToHttp()
            .getRequest<Request<{ serverIdOrAlias: string }>>();
          return request.params.serverIdOrAlias;
        }
      }
    }
  }
}
