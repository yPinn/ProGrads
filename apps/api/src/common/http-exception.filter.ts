import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { ExceptionFilter } from "@nestjs/common";
import type { ErrorCode } from "@prograds/shared";

// Maps any thrown exception to the unified error envelope. See docs/05-api-conventions.md.
const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
};

// Minimal reply surface — avoids a hard dependency on fastify types.
interface Reply {
  status(code: number): { send(body: unknown): void };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<Reply>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const code: ErrorCode = STATUS_TO_CODE[status] ?? "INTERNAL";

    let message = "Internal server error";
    let details: unknown = null;

    if (isHttp) {
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (res && typeof res === "object") {
        const body = res as Record<string, unknown>;
        if (typeof body.message === "string") {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = body.message.join(", ");
        } else {
          message = exception.message;
        }
        details = body.errors ?? body.details ?? null;
      }
    }

    // Server-side: log full context for 5xx and unexpected errors only.
    if (!isHttp || status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      );
    }

    reply.status(status).send({ error: { code, message, details } });
  }
}
