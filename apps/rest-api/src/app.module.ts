import {
  CacheModule,
  ClassSerializerInterceptor,
  Module,
} from '@nestjs/common';
import { ServersModule } from './servers/servers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserserverApiAuthModule } from '@mypvp/userserver-api-auth';
import { Server } from './servers/server.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { Token } from './auth/token.entity';
import { ServerPermissionsModule } from './server-permissions/server-permissions.module';
import { ServerPermission } from './server-permissions/server-permission.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServerVersionsModule } from './server-versions/server-versions.module';
import { ServerVersion } from './server-versions/server-version.entity';
import { ServerExtensionsModule } from './server-extensions/server-extensions.module';
import { ServerExtensionVersion } from './server-extensions/server-extension-version.entity';
import { ServerExtensionFile } from './server-extensions/server-extension-file.entity';
import { ServerExtension } from './server-extensions/server-extension.entity';
import { FilesModule } from './server-files/files.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RpcConnectionManagerModule } from '@userserver-api/services';
import { join } from 'path';
import { EventsModule } from './events/events.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServerDomain } from './server-domains/server-domain.entity';
import { ServerDomainRecord } from './server-domains/server-domain-record.entity';
import { ServerDomainsModule } from './server-domains/server-domains.module';
import { ServerSettingsModule } from './server-settings/server-settings.module';
import { migrations } from './migrations';
import { UserSessionsModule } from './user-sessions/user-sessions.module';
import { UserSession } from './user-sessions/user-session.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwksClient } from 'jwks-rsa';
import { ServerStatsModule } from './server-stats/server-stats.module';
import { NodesModule } from './nodes/nodes.module';
import { RunnerNode } from './nodes/runner-node.entity';
import { StorageNode } from './nodes/storage-node.entity';
import { RunnerNodeStorageNode } from './nodes/runner-node-storage-node.entity';

@Module({
  imports: [
    // Dependencies
    CacheModule.register({ isGlobal: true }),

    JwtModule.registerAsync({
      global: true,
      useFactory: async () => {
        const jwksClient = new JwksClient({
          jwksUri: 'https://auth.mypvp.me/.well-known/jwks.json',
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          requestHeaders: {
            'User-Agent': 'axios/0.19.2',
          },
        });

        let secret = await jwksClient.getSigningKeys();

        return {
          secretOrKeyProvider: (type, payload): string => {
            // Update "Cache" ((ノಠ益ಠ)ノ彡┻━┻)
            jwksClient.getSigningKeys().then((keys) => {
              secret = keys;
            });
            if (typeof payload !== 'string') return '';
            const header = payload.split('.')[0];
            const { kid } = JSON.parse(
              Buffer.from(header, 'base64').toString(),
            );

            const key = secret.find((value) => value.kid === kid);
            return key.getPublicKey();
          },
          verifyOptions: {
            algorithms: ['RS256'],
          },
        };
      },
    }),

    ScheduleModule.forRoot(),
    UserserverApiAuthModule.forRoot(process.env.USERSERVER_AUTH_REDIS),
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE as 'mysql' | 'mariadb',
      database: process.env.DATABASE_NAME,
      password: process.env.DATABASE_PASSOWRD,
      username: process.env.DATABASE_USERNAME,
      port: +process.env.DATABASE_PORT,
      host: process.env.DATABASE_HOST,
      synchronize: false,
      entities: [
        Server,
        User,
        Token,
        ServerPermission,
        ServerVersion,
        ServerExtensionVersion,
        ServerExtensionFile,
        ServerExtension,
        ServerDomain,
        ServerDomainRecord,
        UserSession,
        RunnerNode,
        StorageNode,
        RunnerNodeStorageNode,
      ],
      migrationsTableName: 'userserver_migrations',
      migrations: migrations,
      migrationsRun: true,
      logging: !process.env.DATABASE_LOGGING,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    EventEmitterModule.forRoot({ wildcard: true }),
    RpcConnectionManagerModule.forRoot([
      {
        supportedServices: ['FilesService', 'ExtensionsService'],
        options: {
          url: 'files-api:5000',
          package: ['files', 'extensions'],
          protoPath: [
            join(process.cwd(), 'proto/files/files.proto'),
            join(process.cwd(), 'proto/extensions/extensions.proto'),
          ],
        },
      },
      {
        supportedServices: ['ContainersService'],
        options: {
          url: 'container-api:5000',
          package: ['containers'],
          protoPath: [join(process.cwd(), 'proto/containers/containers.proto')],
        },
      },
    ]),
    //Modules
    ServerVersionsModule,
    ServerExtensionsModule,
    ServerDomainsModule,
    ServerSettingsModule,
    ServersModule,
    UsersModule,
    AuthModule,
    ServerPermissionsModule,
    FilesModule,
    EventsModule,
    UserSessionsModule,
    ServerStatsModule,
    NodesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
