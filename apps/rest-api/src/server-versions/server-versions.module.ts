import { Module } from '@nestjs/common';
import { ServerVersionsService } from './server-versions.service';
import { ServerVersionsController } from './server-versions.controller';

@Module({
  providers: [ServerVersionsService],
  controllers: [ServerVersionsController],
  exports: [ServerVersionsService],
})
export class ServerVersionsModule {}
