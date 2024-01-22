import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

export const ServerIdOrAliasParam = (): ReturnType<typeof applyDecorators> => {
  return applyDecorators(ApiParam({ name: 'serverIdOrAlias', type: 'string' }));
};
