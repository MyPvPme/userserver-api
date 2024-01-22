import {
  applyDecorators,
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  GoneException,
  HttpException,
  HttpStatus,
  HttpVersionNotSupportedException,
  ImATeapotException,
  InternalServerErrorException,
  MethodNotAllowedException,
  MisdirectedException,
  NotAcceptableException,
  NotFoundException,
  NotImplementedException,
  PayloadTooLargeException,
  PreconditionFailedException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';

export function ThrowsExceptions(
  ...exceptions: (typeof HttpException)[]
): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ...exceptions.map((exception) =>
      ApiResponse({
        status: getStatusCodeFromType(exception),
        type: ExceptionResponse,
      }),
    ),
    ApiResponse({
      status: 500,
      type: ExceptionResponse,
    }),
    ApiResponse({
      status: 400,
      type: ExceptionResponse,
    }),
  );
}

function getStatusCodeFromType(exception: typeof HttpException): number {
  if (exception instanceof BadRequestException) {
    return HttpStatus.BAD_REQUEST;
  } else if (exception instanceof UnauthorizedException) {
    return HttpStatus.UNAUTHORIZED;
  } else if (exception instanceof MethodNotAllowedException) {
    return HttpStatus.METHOD_NOT_ALLOWED;
  } else if (exception instanceof NotFoundException) {
    return HttpStatus.NOT_FOUND;
  } else if (exception instanceof ForbiddenException) {
    return HttpStatus.FORBIDDEN;
  } else if (exception instanceof NotAcceptableException) {
    return HttpStatus.NOT_ACCEPTABLE;
  } else if (exception instanceof RequestTimeoutException) {
    return HttpStatus.REQUEST_TIMEOUT;
  } else if (exception instanceof ConflictException) {
    return HttpStatus.CONFLICT;
  } else if (exception instanceof GoneException) {
    return HttpStatus.GONE;
  } else if (exception instanceof PayloadTooLargeException) {
    return HttpStatus.PAYLOAD_TOO_LARGE;
  } else if (exception instanceof UnsupportedMediaTypeException) {
    return HttpStatus.UNSUPPORTED_MEDIA_TYPE;
  } else if (exception instanceof UnprocessableEntityException) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  } else if (exception instanceof InternalServerErrorException) {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  } else if (exception instanceof NotImplementedException) {
    return HttpStatus.NOT_IMPLEMENTED;
  } else if (exception instanceof HttpVersionNotSupportedException) {
    return HttpStatus.HTTP_VERSION_NOT_SUPPORTED;
  } else if (exception instanceof BadGatewayException) {
    return HttpStatus.BAD_GATEWAY;
  } else if (exception instanceof ServiceUnavailableException) {
    return HttpStatus.SERVICE_UNAVAILABLE;
  } else if (exception instanceof GatewayTimeoutException) {
    return HttpStatus.GATEWAY_TIMEOUT;
  } else if (exception instanceof ImATeapotException) {
    return HttpStatus.I_AM_A_TEAPOT;
  } else if (exception instanceof PreconditionFailedException) {
    return HttpStatus.PRECONDITION_FAILED;
  } else if (exception instanceof MisdirectedException) {
    return HttpStatus.MISDIRECTED;
  } else {
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

export class ExceptionResponse {
  @ApiProperty()
  exception: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ required: false })
  traceId?: string;
}
