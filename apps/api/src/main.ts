import "reflect-metadata";
import helmet from "@fastify/helmet";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module.js";
import { HttpExceptionFilter } from "./common/http-exception.filter.js";
import type { Env } from "./config/env.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  await app.register(helmet);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS for the cross-origin web app. Its origin is WEB_BASE_URL (dev :3000; prod app.<domain>).
  // credentials:true so the httpOnly auth cookie can flow once auth lands.
  app.enableCors({
    origin: configService.getOrThrow<string>("WEB_BASE_URL"),
    credentials: true,
  });

  // Tags declared here in logical (domain) order with descriptions; controller @ApiTags
  // values must match these slugs (all lowercase plural). See docs/05-api-conventions.md.
  const config = new DocumentBuilder()
    .setTitle("ProGrads API")
    .setDescription("台灣研究所考試備考平台 API — 考古題、AI 解析、報名情報。")
    .setVersion("0.1.0")
    .addTag("health", "存活探針")
    .addTag("categories", "L1 大類組（理工 / 商管 / 人文）")
    .addTag("tracks", "L2 所別 / 類組（導覽主軸）")
    .addTag("subjects", "考科（全域共用題庫）")
    .addTag("schools", "學校")
    .addTag("departments", "系所（跨軸：track ↔ school）")
    .addTag("exams", "考卷（school × dept × year；含合科卷）")
    .addTag("questions", "題目（題庫內容；跨校練單科 / 考卷視圖）")
    .addTag("admissions", "招生情報（系所組別 × 逐年梯次：名額 / 考科 / 日程）")
    .addTag("schedules", "招生行事曆（報名 / 筆試 / 面試 / 放榜事件）")
    .build();
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup("api/v1/docs", app, document, {
    jsonDocumentUrl: "api/v1/docs-json",
    customSiteTitle: "ProGrads API Docs",
    swaggerOptions: { operationsSorter: "alpha", persistAuthorization: true },
  });

  const port = configService.getOrThrow<number>("PORT");
  const host = configService.getOrThrow<string>("HOST");
  await app.listen({ port, host });
}

void bootstrap();
