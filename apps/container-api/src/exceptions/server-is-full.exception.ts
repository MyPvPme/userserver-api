import { RpcException } from '@nestjs/microservices';

export class ServerIsFullException extends RpcException {
  constructor() {
    super(ServerIsFullException.name);
  }
}
