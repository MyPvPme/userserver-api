import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import * as AWS from 'aws-sdk';
import { InfluxdbModule } from '../influxdb/influxdb.module';
import { NodesModule } from '../nodes/nodes.module';

@Module({
  imports: [InfluxdbModule, NodesModule],
  providers: [
    FilesService,
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
  controllers: [FilesController],
})
export class FilesModule {}
