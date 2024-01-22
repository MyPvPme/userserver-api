import { InternalServerErrorException } from '@nestjs/common';

export function getErrorHandlingProxy<T extends object>(object: T): T {
  return new Proxy<T>(object, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(target: T, p: string | symbol): any {
      const methode = target[p];
      if (typeof methode !== 'function') return target[p];

      return function (...args) {
        try {
          return methode.apply(this, args);
        } catch (e) {
          throw new InternalServerErrorException();
        }
      };
    },
  });
}
