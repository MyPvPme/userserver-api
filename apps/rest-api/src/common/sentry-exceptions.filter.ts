import {
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
  Optional,
  HttpStatus,
  InternalServerErrorException,
  HttpServer,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { WsException } from '@nestjs/websockets';
import { withScope } from '@sentry/node';
import { Span } from '@sentry/tracing';
import { MESSAGES } from '@nestjs/core/constants';
import { ExceptionResponse } from './throws-exceptions.decorator';
import { isObject } from '@nestjs/common/utils/shared.utils';

@Catch()
export class SentryExceptionsFilter implements ExceptionFilter {
  private static readonly logger = new Logger('ExceptionsHandler');

  @Optional()
  @Inject()
  protected readonly httpAdapterHost?: HttpAdapterHost;

  constructor(protected readonly applicationRef?: HttpServer) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(exception: any, host: ArgumentsHost): void {
    let user;
    let transaction: Span;

    const applicationRef =
      this.applicationRef ||
      (this.httpAdapterHost && this.httpAdapterHost.httpAdapter);

    // Response
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: string = InternalServerErrorException.name;
    let message: string = MESSAGES.UNKNOWN_EXCEPTION_MESSAGE;
    let traceId: string = undefined;

    switch (host.getType()) {
      case 'http': {
        const httpContext = host.switchToHttp();
        user = httpContext.getRequest().user;
        transaction = httpContext.getRequest().__sentry_transaction;
        break;
      }
      case 'ws': {
        const wsContext = host.switchToWs();
        user = wsContext.getClient().user;

        break;
      }
    }

    if (user) Sentry.setUser(user);

    if (exception instanceof HttpException) {
      if (exception.getStatus() >= 500) {
        withScope((scope) => {
          if (transaction && scope.getSpan() === undefined) {
            scope.setSpan(transaction);
          }
          traceId = Sentry.captureException(exception);
        });
      }

      error = exception.name;
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof WsException) {
      error = exception.name;
      message = exception.message;
    } else {
      if (this.isExceptionObject(exception)) {
        SentryExceptionsFilter.logger.error(exception.message, exception.stack);
      } else {
        SentryExceptionsFilter.logger.error(exception);
      }
      traceId = Sentry.captureException(exception);
    }

    applicationRef.reply(
      host.getArgByIndex(1),
      {
        exception: error,
        message,
        status,
        traceId,
      } as ExceptionResponse,
      status,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public isExceptionObject(err: any): err is Error {
    return isObject(err) && !!(err as Error).message;
  }
}
