import { Module } from '@nestjs/common';
import { NodesService } from './nodes.service';

@Module({
  providers: [NodesService],
  exports: [NodesService],
})
export class NodesModule {}
