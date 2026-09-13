import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { validateEnv, type Env } from "./config/env.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { TaxonomyModule } from "./modules/taxonomy/taxonomy.module.js";
import { SchoolsModule } from "./modules/schools/schools.module.js";
import { FacultyModule } from "./modules/faculty/faculty.module.js";
import { AdmissionsModule } from "./modules/admissions/admissions.module.js";
import { ExamsModule } from "./modules/exams/exams.module.js";
import { QuestionsModule } from "./modules/questions/questions.module.js";
import { StatsModule } from "./modules/stats/stats.module.js";
import { CoverageModule } from "./modules/content-coverage/coverage.module.js";
import { ReportsModule } from "./modules/reports/reports.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          { ttl: config.getOrThrow("THROTTLE_TTL"), limit: config.getOrThrow("THROTTLE_LIMIT") },
        ],
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
      },
    }),
    PrismaModule,
    HealthModule,
    TaxonomyModule,
    SchoolsModule,
    FacultyModule,
    AdmissionsModule,
    ExamsModule,
    QuestionsModule,
    StatsModule,
    CoverageModule,
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
