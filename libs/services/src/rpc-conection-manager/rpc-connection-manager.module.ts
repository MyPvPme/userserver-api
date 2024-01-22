import { DynamicModule, Module } from '@nestjs/common';
import { GrpcOptions } from '@nestjs/microservices';
import { RpcServiceManager } from '@userserver-api/services/rpc-conection-manager/rpc-service-manager.service';

@Module({})
export class RpcConnectionManagerModule {
  static forRoot(options: RpcConnectionOptions[]): DynamicModule {
    return {
      global: true,
      module: RpcConnectionManagerModule,
      exports: [RpcServiceManager],
      providers: [
        RpcServiceManager,
        { provide: 'RPC_CONNECTION_OPTIONS', useValue: options },
      ],
    };
  }
}

export interface RpcConnectionOptions {
  options: GrpcOptions['options'];
  supportedServices: string[];
}
