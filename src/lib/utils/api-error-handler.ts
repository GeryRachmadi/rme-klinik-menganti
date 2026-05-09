export interface ApiErrorResult {
  status: number;
  message: string;
  isRetryable: boolean;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Data yang dikirim tidak valid. Periksa kembali isian form.',
  401: 'Sesi Anda telah berakhir. Silakan login kembali.',
  403: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
  404: 'Data tidak ditemukan.',
  409: 'Data konflik. Silakan muat ulang halaman.',
  422: 'Data tidak dapat diproses. Periksa kembali isian form.',
  500: 'Terjadi kesalahan pada server. Coba lagi beberapa saat.',
  503: 'Layanan tidak tersedia sementara. Coba lagi beberapa saat.',
};

const RETRYABLE_STATUSES = new Set([500, 503]);

export async function handleApiError(response: Response): Promise<ApiErrorResult> {
  let serverMessage: string | undefined;
  try {
    const body = await response.json();
    serverMessage = body?.error ?? body?.message;
  } catch {
    // biarkan serverMessage undefined
  }

  const message =
    serverMessage ??
    STATUS_MESSAGES[response.status] ??
    'Terjadi kesalahan sistem.';

  return {
    status: response.status,
    message,
    isRetryable: RETRYABLE_STATUSES.has(response.status),
  };
}
