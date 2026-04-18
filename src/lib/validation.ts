import { z } from 'zod';

/**
 * Schema for creating a new account with full practitioner data
 * Used in POST /api/accounts
 */
export const createAccountSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh mengandung huruf, angka, titik, garis bawah, dan garis'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter'),
  role: z
    .enum(['ADMIN', 'PENDAFTARAN', 'PERAWAT', 'DOKTER'], {
      error: 'Role harus salah satu dari: ADMIN, PENDAFTARAN, PERAWAT, DOKTER',
    }),
  nik: z
    .string()
    .regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  namaLengkap: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  spesialisasi: z
    .string()
    .optional()
    .default(''),
});

/**
 * Schema for updating an account (partial update)
 * Used in PATCH /api/accounts/:id
 * All fields are optional
 */
export const updateAccountSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh mengandung huruf, angka, titik, garis bawah, dan garis')
    .optional(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .optional(),
  nik: z
    .string()
    .regex(/^\d{16}$/, 'NIK harus 16 digit angka')
    .optional(),
  namaLengkap: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .optional(),
  spesialisasi: z
    .string()
    .optional(),
});

// Type exports for use in API routes
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;