import { Express, Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

interface RenderParams {
  req: Request;
  res: Response;
}

interface ConfigureParams {
  app: Express;
  render?: (params: RenderParams) => Promise<void>;
}

export default async function bootstrap({
  app: server,
  render,
}: ConfigureParams) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.setGlobalPrefix('api');
  app.useGlobalFilters({
    async catch(exception, host) {
      const ctx = host.switchToHttp();
      const status = exception.getStatus() as number;
      const next = ctx.getNext();
      if (status === 404 && render) {
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();
        await render({ req, res });
      } else {
        next();
      }
    },
  });
  const config = new DocumentBuilder()
    .setTitle('Quasar Nest example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  return app;
}
