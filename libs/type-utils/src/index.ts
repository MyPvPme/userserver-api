import { Observable } from 'rxjs';

export type AddObservables<Type> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [Property in keyof Type]: Type[Property] extends (any) => any
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ReturnType<Type[Property]> extends Observable<any>
      ? Type[Property]
      : (
          ...args: Parameters<Type[Property]>
        ) => Observable<ReturnType<Type[Property]>>
    : Type[Property];
};

export type AddOptionalPromise<Type> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [Property in keyof Type]: Type[Property] extends (...any) => any
    ? (
        ...args: Parameters<Type[Property]>
      ) => Promise<ReturnType<Type[Property]>> | ReturnType<Type[Property]>
    : Type[Property];
};
