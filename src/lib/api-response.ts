import { NextResponse } from 'next/server';

/**
 * Standard success response structure
 */
export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

/**
 * Standard error response structure
 */
export type ErrorResponse = {
  success: false;
  error: string;
  statusCode: number;
};

/**
 * Create a standardized success response
 * @param data - The response payload
 * @param message - Optional success message
 * @param statusCode - HTTP status code (default 200)
 */
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): { response: SuccessResponse<T>; status: number } {
  return {
    response: { success: true, data, ...(message && { message }) },
    status: statusCode,
  };
}

/**
 * Create a standardized error response
 * @param error - Error message
 * @param statusCode - HTTP status code (default 500)
 */
export function errorResponse(
  error: string,
  statusCode: number = 500
): { response: ErrorResponse; status: number } {
  return {
    response: { success: false, error, statusCode },
    status: statusCode,
  };
}

/**
 * Convert response to NextResponse
 */
export function toNextResponse<T>(
  result: { response: SuccessResponse<T> | ErrorResponse; status: number }
): NextResponse<SuccessResponse<T> | ErrorResponse> {
  return NextResponse.json(result.response, { status: result.status });
}

/**
 * Helper: Success response to NextResponse
 */
export function okResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<SuccessResponse<T>> {
  const { response, status } = successResponse(data, message, statusCode);
  return NextResponse.json(response, { status });
}

/**
 * Helper: Error response to NextResponse
 */
export function errResponse(
  error: string,
  statusCode: number = 500
): NextResponse<ErrorResponse> {
  const { response, status } = errorResponse(error, statusCode);
  return NextResponse.json(response, { status });
}