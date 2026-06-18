import { ApiBadRequestResponse, ApiNotFoundResponse } from "@nestjs/swagger";
import { ErrorResponseDto } from "./dto/error-response.dto.js";

// Reusable Swagger error-response decorators, all using the unified error envelope.
// 404 for detail endpoints (resource missing); 400 for endpoints with query/param validation.
export const ApiNotFound = (description = "找不到資源"): MethodDecorator =>
  ApiNotFoundResponse({ type: ErrorResponseDto, description });

export const ApiBadRequest = (description = "請求參數驗證失敗"): MethodDecorator =>
  ApiBadRequestResponse({ type: ErrorResponseDto, description });
