import * as rawbody from 'raw-body';
import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

export const PlainBodyDecorator = createParamDecorator(
  async (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.readable) return (await rawbody(req)).toString();
    throw new HttpException(
      'Body aint text/plain',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  },
);
