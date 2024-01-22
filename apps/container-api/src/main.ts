import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ContainersModule } from './containers.module';
import * as Sentry from '@sentry/node';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ContainersModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['containers'],
        protoPath: [join(process.cwd(), './proto/containers/containers.proto')],
        url: '0.0.0.0:5000',
      },
    },
  );
  await app.listen();
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
