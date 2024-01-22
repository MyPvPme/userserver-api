import { CustomDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const ServerIdOrAliasExtractor = (
  extractor: (context: ExecutionContext) => string,
): CustomDecorator<string> => SetMetadata('server-id-extractor', extractor);
