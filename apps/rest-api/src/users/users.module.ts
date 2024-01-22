import { Global, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoadUserInterceptor } from './load-user.interceptor';
import { UserSubscriber } from './user.subscriber';
import {
  Configuration,
  createConfiguration,
  ServerConfiguration,
} from '@mypvp/base-rest-client-nodejs';

@Global()
@Module({
  controllers: [UsersController],
  imports: [],
  providers: [
    UsersService,
    UserSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoadUserInterceptor,
    },
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
  exports: [UsersService],
})
export class UsersModule {}
