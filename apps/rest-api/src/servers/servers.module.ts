import { Global, Module } from '@nestjs/common';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { LoadServerInterceptor } from './server.interceptor';
import { ServerVersionsModule } from '../server-versions/server-versions.module';
import { ServerPingService } from './server-ping.service';
import { ServerSettingsModule } from '../server-settings/server-settings.module';
import { ServerConsoleGateway } from './server-console.gateway';
import { ServerExtensionsModule } from '../server-extensions/server-extensions.module';
import {
  Configuration,
  createConfiguration,
  ServerConfiguration,
} from '@mypvp/base-rest-client-nodejs';
import { ServerStopService } from './server-stop.service';
import { MinecraftChatFormatModule } from '../minecraft-chat-format/minecraft-chat-format.module';
import { NodesModule } from '../nodes/nodes.module';

@Global()
@Module({
  controllers: [ServersController],
  providers: [
    ServersService,
    LoadServerInterceptor,
    ServerPingService,
    ServerConsoleGateway,
    ServerStopService,
    {
      provide: 'BASE_REST_CONFIGURATION',
      useFactory(): Configuration {
        return createConfiguration({
          baseServer: new ServerConfiguration(process.env.BASE_API_URL, {}),
          authMethods: {
            bearerAuth: {
              tokenProvider: {
                getToken: () => process.env.BASE_API_TOKEN,
              },
            },
          },
        });
      },
    },
  ],
  exports: [ServersService, LoadServerInterceptor],
  imports: [
    ServerVersionsModule,
    ServerSettingsModule,
    ServerExtensionsModule,
    MinecraftChatFormatModule,
    NodesModule,
  ],
})
export class ServersModule {}
