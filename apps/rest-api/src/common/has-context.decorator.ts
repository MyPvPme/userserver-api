import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function HasContext(
  optional?: boolean,
): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiQuery({
      name: 'context',
      type: String,
      description: optional
        ? 'Can optionally be used by an system token'
        : 'Required if an System token is used',
      required: false,
    }),
  );
}
