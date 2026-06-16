import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { validateEnv } from "./config/env.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { TaxonomyModule } from "./modules/taxonomy/taxonomy.module.js";
import { SchoolsModule } from "./modules/schools/schools.module.js";
import { ExamsModule } from "./modules/exams/exams.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
      },
    }),
    PrismaModule,
    HealthModule,
    TaxonomyModule,
    SchoolsModule,
    ExamsModule,
  ],
})
export class AppModule {}
