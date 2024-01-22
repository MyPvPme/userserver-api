import { Module } from '@nestjs/common';
import { ServerPermissionsController } from './server-permissions.controller';
import { ServerPermissionsService } from './server-permissions.service';
import { ServersModule } from '../servers/servers.module';

@Module({
  controllers: [ServerPermissionsController],
  providers: [ServerPermissionsService],
  imports: [ServersModule],
})
export class ServerPermissionsModule {}
