import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpExceptionFilter } from "./http-exception.filter.js";

// Captures the (status, body) the filter writes so assertions read the envelope directly.
function makeReply() {
  const sent: { status?: number; body?: unknown } = {};
  const reply = {
    sent,
    status(code: number) {
      sent.status = code;
      return {
        send(body: unknown) {
          sent.body = body;
        },
      };
    },
  };
  return reply;
}

function makeHost(reply: ReturnType<typeof makeReply>): ArgumentsHost {
  return {
    switchToHttp: () => ({ getResponse: () => reply }),
  } as unknown as ArgumentsHost;
}

describe("HttpExceptionFilter", () => {
  const filter = new HttpExceptionFilter();
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The filter logs 5xx/unexpected errors; silence it and assert on the spy instead.
    errorLog = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  function run(exception: unknown) {
    const reply = makeReply();
    filter.catch(exception, makeHost(reply));
    return reply.sent;
  }

  it("maps a known status to its stable error code (object message)", () => {
    const sent = run(new NotFoundException("查無資料"));
    expect(sent.status).toBe(404);
    expect(sent.body).toEqual({ error: { code: "NOT_FOUND", message: "查無資料", details: null } });
    expect(errorLog).not.toHaveBeenCalled(); // 4xx are not logged
  });

  it("reads a plain string HttpException response as the message", () => {
    const sent = run(new HttpException("teapot", 400));
    expect(sent.status).toBe(400);
    expect(sent.body).toEqual({ error: { code: "BAD_REQUEST", message: "teapot", details: null } });
  });

  it("joins an array message and surfaces validation errors as details", () => {
    const sent = run(new BadRequestException({ message: ["a", "b"], errors: { field: "bad" } }));
    expect(sent.body).toEqual({
      error: { code: "BAD_REQUEST", message: "a, b", details: { field: "bad" } },
    });
  });

  it("falls back to exception.message and body.details when message is absent", () => {
    const sent = run(new HttpException({ details: { hint: "x" } }, 409));
    const body = sent.body as { error: { code: string; message: string; details: unknown } };
    expect(body.error.code).toBe("CONFLICT");
    expect(body.error.details).toEqual({ hint: "x" });
    expect(typeof body.error.message).toBe("string");
  });

  it("maps an unmapped HTTP status to the INTERNAL code", () => {
    const sent = run(new HttpException("gone", 418));
    expect(sent.status).toBe(418);
    expect((sent.body as { error: { code: string } }).error.code).toBe("INTERNAL");
  });

  it("treats a non-HttpException Error as a logged 500", () => {
    const sent = run(new Error("boom"));
    expect(sent.status).toBe(500);
    expect(sent.body).toEqual({
      error: { code: "INTERNAL", message: "Internal server error", details: null },
    });
    expect(errorLog).toHaveBeenCalledTimes(1);
  });

  it("stringifies a non-Error thrown value for the 500 log", () => {
    const sent = run("just a string");
    expect(sent.status).toBe(500);
    expect(errorLog).toHaveBeenCalledWith("just a string");
  });
});
