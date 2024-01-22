import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { SentryExceptionsFilter } from './common/sentry-exceptions.filter';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { Event } from './events/event.entity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(process.env.API_GLOBAL_PREFIX);

  const { httpAdapter } = app.get(HttpAdapterHost);

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN as string,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({
          // to trace all requests to the default router
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          app: app.getHttpAdapter() as any,
          // alternatively, you can specify the routes you want to trace:
          // router: someRouter,
        }),
      ],
      release: process.env.npm_package_version,

      // We recommend adjusting this value in production, or using tracesSampler
      // for finer control
      tracesSampleRate: 1.0,
    });

    app.use(Sentry.Handlers.requestHandler({ user: true }));
    app.use(Sentry.Handlers.tracingHandler());
    app.useGlobalFilters(new SentryExceptionsFilter(httpAdapter));
  }

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGINS.split(','),
    preflightContinue: false,
    credentials: true,
    methods: ['POST', 'PUT', 'GET', 'DELETE', 'PATCH'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setBasePath(process.env.API_GLOBAL_PREFIX)
    .setTitle('Userserver API')
    .setDescription('The Core API for the usersers')
    .setVersion(process.env.npm_package_version)
    .addBearerAuth()
    .addCookieAuth('userserver-api-token')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [Event],
  });

  if (process.env.GENERATE_OPENAPI_ONLY) {
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
    process.exit(0);
    return;
  }

  SwaggerModule.setup(process.env.API_GLOBAL_PREFIX, app, document);

  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
