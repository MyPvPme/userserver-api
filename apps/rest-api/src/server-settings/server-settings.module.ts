import { Module } from '@nestjs/common';
import { ServerSettingsService } from './server-settings.service';
import { ServerSettingsController } from './server-settings.controller';
import { NodesModule } from '../nodes/nodes.module';

@Module({
  imports: [NodesModule],
  providers: [ServerSettingsService],
  controllers: [ServerSettingsController],
  exports: [ServerSettingsService],
})
export class ServerSettingsModule {}
