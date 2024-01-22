import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { ExtensionsService } from './extensions.service';
import * as AWS from 'aws-sdk';

@Module({
  imports: [],
  controllers: [FilesService, ExtensionsService],
  providers: [
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
})
export class FilesModule {}
