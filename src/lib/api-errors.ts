import { Prisma } from '@prisma/client';
import type { ZodError, ZodIssue } from 'zod';
import { errorResponse } from './api-response';

/**
 * Handle Prisma errors and return standardized error response
 * Maps Prisma error codes to user-friendly messages
 */
export function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (error.code === 'P2002') {
      const field = error.meta?.target ? (error.meta.target as string[])[0] : 'field';
      if (field === 'username') {
        return errorResponse('Username sudah digunakan.', 400);
      }
      if (field === 'nik') {
        return errorResponse('NIK sudah terdaftar dalam sistem.', 400);
      }
      return errorResponse(`${field} sudah digunakan.`, 400);
    }

    // P2003: Foreign key constraint failed (related records exist)
    if (error.code === 'P2003') {
      return errorResponse(
        'Akun tidak dapat dihapus karena memiliki riwayat medis terkait. Silakan gunakan fitur Nonaktifkan (Toggle Status).',
        400
      );
    }

    // P2025: Record not found
    if (error.code === 'P2025') {
      return errorResponse('Akun tidak ditemukan.', 404);
    }

    // P2014: Required relation violation
    if (error.code === 'P2014') {
      return errorResponse('Data terkait tidak dapat diproses.', 400);
    }

    // Generic Prisma error
    console.error('Prisma error:', error);
    return errorResponse('Terjadi kesalahan pada database.', 500);
  }

  // Handle transaction errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    console.error('Prisma panic:', error);
    return errorResponse('Terjadi kesalahan kritis pada database.', 500);
  }

  // Fallback for unexpected errors
  console.error('Unexpected error:', error);
  return errorResponse('Terjadi kesalahan pada server.', 500);
}

/**
 * Handle Zod validation errors and return standardized error response
 */
export function handleZodError(error: ZodError) {
  const fieldErrors = error.issues.map((err: ZodIssue) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });

  return errorResponse(
    `Validasi gagal: ${fieldErrors.join('; ')}`,
    400
  );
}

/**
 * Safe parse JSON body with error handling
 */
export async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch (error) {
    return errorResponse('Format JSON tidak valid.', 400);
  }
}