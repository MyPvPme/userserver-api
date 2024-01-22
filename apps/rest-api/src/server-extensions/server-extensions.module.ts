import { CacheModule, Module } from '@nestjs/common';
import { ServerExtensionsService } from './server-extensions.service';
import { ServerExtensionsController } from './server-extensions.controller';
import * as AWS from 'aws-sdk';
import { NodesModule } from '../nodes/nodes.module';

@Module({
  imports: [CacheModule.register(), NodesModule],
  providers: [
    ServerExtensionsService,
    {
      provide: 'S3',
      useFactory: (): AWS.S3 => {
        return new AWS.S3({
          endpoint: process.env.S3_URL,
          s3ForcePathStyle: true,
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          signatureVersion: 'v4',
        });
      },
    },
  ],
  controllers: [ServerExtensionsController],
  exports: [ServerExtensionsService],
})
export class ServerExtensionsModule {}
