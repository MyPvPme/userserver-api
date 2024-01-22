import { Module } from '@nestjs/common';
import { ContainersService } from './containers.service';
import * as Docker from 'dockerode';

@Module({
  imports: [],
  controllers: [ContainersService],
  providers: [
    {
      provide: Docker,
      useValue: new Docker(
        process.env.DOCKER_CONNECTION_TYPE === 'tcp'
          ? {
              host: process.env.DOCKER_CONNECTION_SOCKET,
              port: +process.env.DOCKER_CONNECTION_SOCKET_PORT,
            }
          : { socketPath: process.env.DOCKER_CONNECTION_SOCKET },
      ),
    },
  ],
})
export class ContainersModule {}
