import { Module } from '@nestjs/common';
import { InfluxDB } from '@influxdata/influxdb-client';

@Module({
  providers: [
    {
      provide: InfluxDB,
      useFactory: (): InfluxDB =>
        new InfluxDB({
          url: process.env.INFLUXDB_URL,
          token: process.env.INFLUXDB_TOKEN,
        }),
    },
  ],
  exports: [InfluxDB],
})
export class InfluxdbModule {}
