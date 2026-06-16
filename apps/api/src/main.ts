import "reflect-metadata";
import helmet from "@fastify/helmet";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  await app.register(helmet);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder().setTitle("ProGrads API").setVersion("0.1").build();
  SwaggerModule.setup("api/v1/docs", app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen({ port, host });
}

void bootstrap();
