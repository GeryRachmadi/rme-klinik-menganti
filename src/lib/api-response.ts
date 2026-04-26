import { NextResponse } from 'next/server';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api';

// Re-export canonical types under their legacy names so existing imports keep working.
export type { ApiSuccessResponse as SuccessResponse, ApiErrorResponse as ErrorResponse };
export type { ApiSuccessResponse, ApiErrorResponse };

export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): { response: ApiSuccessResponse<T>; status: number } {
  return {
    response: { success: true, data, ...(message && { message }) },
    status: statusCode,
  };
}

export function errorResponse(
  error: string,
  statusCode: number = 500
): { response: ApiErrorResponse; status: number } {
  return {
    response: { success: false, error, statusCode },
    status: statusCode,
  };
}

export function okResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const { response, status } = successResponse(data, message, statusCode);
  return NextResponse.json(response, { status });
}

export function errResponse(
  error: string,
  statusCode: number = 500
): NextResponse<ApiErrorResponse> {
  const { response, status } = errorResponse(error, statusCode);
  return NextResponse.json(response, { status });
}
